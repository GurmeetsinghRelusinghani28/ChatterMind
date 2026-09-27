import "dotenv/config";
import crypto from "crypto";
import Redis from "ioredis";
import { redisErrorsTotal } from "../monitoring/metrics.js";

export const CACHE_TTL = {
	activeRooms: 30 * 60,
	profile: 30 * 60,
	recentMessages: 30 * 60,
	aiResponse: 60 * 60,
};

const poolSize = Math.max(1, Number(process.env.REDIS_POOL_SIZE || 2));
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const useTls = process.env.REDIS_TLS === "true";

const redisOptions = process.env.REDIS_URL
	? process.env.REDIS_URL
	: {
			host: redisHost,
			port: redisPort,
			password: redisPassword,
			tls: useTls ? { rejectUnauthorized: false } : undefined,
			lazyConnect: true,
			maxRetriesPerRequest: 1,
			retryStrategy: () => null,
		};

const clients = Array.from({ length: poolSize }, () => new Redis(redisOptions));
let nextClient = 0;
let redisAvailable = false;
const metrics = {
	hits: 0,
	misses: 0,
	errors: 0,
	sets: 0,
	invalidations: 0,
	dbReads: 0,
	startedAt: new Date().toISOString(),
};

for (const client of clients) {
	client.on("error", (error) => {
		metrics.errors += 1;
		redisErrorsTotal.inc();
		if (process.env.NODE_ENV !== "test") {
			console.error(`Redis error: ${error.message}`);
		}
	});
}

function getClient() {
	const client = clients[nextClient];
	nextClient = (nextClient + 1) % clients.length;
	return client;
}

function cacheKey(namespace, value) {
	return `chattermind:${namespace}:${value}`;
}

async function execute(operation, fallback) {
	if (!redisAvailable) return fallback;
	try {
		return await operation(getClient());
	} catch (error) {
		metrics.errors += 1;
		if (fallback !== undefined) return fallback;
		throw error;
	}
}

export async function connectRedis() {
	if (process.env.REDIS_DISABLED === "true") return false;
	if (!process.env.REDIS_URL && (!process.env.REDIS_HOST || !process.env.REDIS_PORT)) {
		console.warn("Redis is not configured. Set REDIS_HOST/REDIS_PORT or REDIS_URL, or set REDIS_DISABLED=true.");
		return false;
	}
	try {
		await Promise.all(clients.map((client) => client.connect()));
		redisAvailable = true;
		console.log(`Redis connected (${clients.length}-client pool)`);
		return true;
	} catch (error) {
		redisAvailable = false;
		metrics.errors += 1;
		await Promise.all(clients.map((client) => client.disconnect()));
		console.warn(`Redis unavailable; continuing without cache: ${error.message}`);
		return false;
	}
}

export async function closeRedis() {
	redisAvailable = false;
	await Promise.all(clients.map((client) => client.quit().catch(() => undefined)));
}

export async function getCache(namespace, value) {
	const result = await execute((client) => client.get(cacheKey(namespace, value)), null);
	if (result === null) {
		metrics.misses += 1;
		return null;
	}
	metrics.hits += 1;
	return JSON.parse(result);
}

export async function setCache(namespace, value, data, ttlSeconds) {
	const result = await execute(
		(client) => client.set(cacheKey(namespace, value), JSON.stringify(data), "EX", ttlSeconds),
		null,
	);
	if (result) metrics.sets += 1;
	return result;
}

export async function deleteCache(namespace, value) {
	const result = await execute((client) => client.del(cacheKey(namespace, value)), 0);
	if (result) metrics.invalidations += result;
	return result;
}

export async function deleteCacheByPattern(pattern) {
	return execute(async (client) => {
		const keys = await client.keys(cacheKey(pattern, "*"));
		if (!keys.length) return 0;
		const deleted = await client.del(...keys);
		metrics.invalidations += deleted;
		return deleted;
	}, 0);
}

export function recordDatabaseRead() {
	metrics.dbReads += 1;
}

export async function getRecentMessages(roomId) {
	const [namespace, key] = cacheKeys.recentMessages(roomId);
	return getCache(namespace, key);
}

export async function cacheRecentMessages(roomId, messages) {
	const [namespace, key] = cacheKeys.recentMessages(roomId);
	return setCache(namespace, key, messages, CACHE_TTL.recentMessages);
}

export async function invalidateRecentMessages(roomId) {
	const [namespace, key] = cacheKeys.recentMessages(roomId);
	return deleteCache(namespace, key);
}

export function getCacheMetrics() {
	const total = metrics.hits + metrics.misses;
	return {
		...metrics,
		poolSize: clients.length,
		requests: total,
		hitRatePercent: total ? Number(((metrics.hits / total) * 100).toFixed(2)) : 0,
		uptimeSeconds: Math.floor((Date.now() - Date.parse(metrics.startedAt)) / 1000),
	};
}

export async function getRedisDashboardData() {
	const info = await execute((client) => client.info("memory"), "");
	const dbSize = await execute((client) => client.dbsize(), 0);
	return {
		generatedAt: new Date().toISOString(),
		metrics: getCacheMetrics(),
		redis: {
			connectedClients: clients.filter((client) => client.status === "ready").length,
			keyCount: dbSize,
			memory: Object.fromEntries(
				info
					.split("\n")
					.filter((line) => line.startsWith("used_memory:"))
					.map((line) => line.split(":", 2)),
			),
		},
	};
}

export function hashQuery(query) {
	return crypto.createHash("sha256").update(query).digest("hex");
}

export const cacheKeys = {
	activeRooms: (userId = "all") => ["active-rooms", userId],
	profile: (userId) => ["profile", userId],
	recentMessages: (roomId) => ["recent-messages", roomId],
	aiResponse: (userId, query) => ["ai-response", `${userId}:${hashQuery(query)}`],
};