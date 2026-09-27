import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import {
  CACHE_TTL,
  cacheKeys,
  closeRedis,
  connectRedis,
  getCache,
  getCacheMetrics,
  setCache,
} from "../services/redis.service.js";

const iterations = Number(process.env.REDIS_BENCHMARK_ITERATIONS || 100);

function elapsedMs(start) {
  return Number((Number(process.hrtime.bigint() - start) / 1e6).toFixed(3));
}

async function measureDb(userId) {
  const start = process.hrtime.bigint();
  for (let index = 0; index < iterations; index += 1) {
    await userModel.findById(userId).select("_id email username").lean();
  }
  return elapsedMs(start);
}

async function measureRedis(userId) {
  const [namespace, key] = cacheKeys.profile(userId);
  await setCache(namespace, key, { _id: userId, email: "benchmark@example.com" }, CACHE_TTL.profile);
  const start = process.hrtime.bigint();
  for (let index = 0; index < iterations; index += 1) {
    await getCache(namespace, key);
  }
  return elapsedMs(start);
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  if (process.env.REDIS_DISABLED === "true") throw new Error("Redis benchmark requires Redis");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const redisConnected = await connectRedis();
  if (!redisConnected) {
    throw new Error("Redis is unreachable. Update REDIS_HOST/REDIS_PORT or REDIS_URL from the Redis Cloud dashboard.");
  }
  const user = await userModel.findOne({}).select("_id email username").lean();
  if (!user) throw new Error("At least one MongoDB user is required for the benchmark");

  const before = getCacheMetrics();
  const dbMs = await measureDb(user._id);
  const afterDb = getCacheMetrics();
  const redisMs = await measureRedis(user._id);
  const afterRedis = getCacheMetrics();
  const dbReads = iterations;
  const cacheRequests = afterRedis.requests - before.requests;
  const cacheHits = afterRedis.hits - before.hits;

  console.log("\nRedis cache benchmark\n");
  console.table([
    {
      Metric: `Average response time (${iterations} reads)`,
      Database: `${(dbMs / iterations).toFixed(3)} ms`,
      Redis: `${(redisMs / iterations).toFixed(3)} ms`,
      Improvement: `${(((dbMs - redisMs) / dbMs) * 100).toFixed(2)}%`,
    },
    {
      Metric: "Database reads",
      Database: dbReads,
      Redis: 0,
      Improvement: "100%",
    },
    {
      Metric: "Cache hit rate",
      Database: "N/A",
      Redis: `${cacheRequests ? ((cacheHits / cacheRequests) * 100).toFixed(2) : 0}%`,
      Improvement: "N/A",
    },
  ]);
  console.log("\nCache metrics:");
  console.table({
    before,
    afterDb,
    afterRedis,
  });
}

try {
  await main();
} catch (error) {
  console.error(`Redis benchmark failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeRedis();
  await mongoose.disconnect();
}
