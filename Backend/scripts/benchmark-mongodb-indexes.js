import "dotenv/config";
import mongoose from "mongoose";
import {
  INDEX_COLLECTIONS,
  createIndexes,
  dropAllNonIdIndexes,
} from "./mongodb-indexes.js";

const BENCHMARK_SIZE = Number(process.env.INDEX_BENCHMARK_SIZE || 5000);
const roomId = new mongoose.Types.ObjectId(process.env.BENCHMARK_ROOM_ID);
const userId = new mongoose.Types.ObjectId(process.env.BENCHMARK_USER_ID);
const benchmarkDate = new Date("2025-01-01T00:00:00.000Z");

const schemas = Object.fromEntries(
  INDEX_COLLECTIONS.map((collectionName) => [
    collectionName,
    mongoose.model(
      `IndexBenchmark${collectionName}`,
      new mongoose.Schema({}, { collection: collectionName, strict: false }),
    ),
  ]),
);

const queries = [
  {
    name: "Users by email",
    model: schemas.users,
    filter: { email: "benchmark@example.com" },
  },
  {
    name: "Users by username",
    model: schemas.users,
    filter: { username: "benchmark-user" },
  },
  {
    name: "Messages in room by date",
    model: schemas.messages,
    filter: { roomId, createdAt: { $gte: benchmarkDate } },
    sort: { createdAt: -1 },
    limit: 50,
  },
  {
    name: "Messages by user",
    model: schemas.messages,
    filter: { userId },
  },
  {
    name: "ChatRooms by owner and date",
    model: schemas.chatrooms,
    filter: { ownerId: userId },
    sort: { createdAt: -1 },
    limit: 50,
  },
  {
    name: "ChatRooms name text search",
    model: schemas.chatrooms,
    filter: { $text: { $search: "benchmark" } },
    limit: 50,
  },
  {
    name: "AI responses by user and time",
    model: schemas.ai_responses,
    filter: { userId },
    sort: { timestamp: -1 },
    limit: 50,
  },
];

function buildBenchmarkDocuments() {
  return {
    users: Array.from({ length: BENCHMARK_SIZE }, (_, index) => ({
      email: index === 0 ? "benchmark@example.com" : `user-${index}@example.com`,
      username: index === 0 ? "benchmark-user" : `user-${index}`,
    })),
    messages: Array.from({ length: BENCHMARK_SIZE }, (_, index) => ({
      roomId: index % 10 === 0 ? roomId : new mongoose.Types.ObjectId(),
      userId: index % 10 === 0 ? userId : new mongoose.Types.ObjectId(),
      createdAt: new Date(benchmarkDate.getTime() + index * 1000),
      content: `Benchmark message ${index}`,
    })),
    chatrooms: Array.from({ length: BENCHMARK_SIZE }, (_, index) => ({
      ownerId: index % 10 === 0 ? userId : new mongoose.Types.ObjectId(),
      createdAt: new Date(benchmarkDate.getTime() + index * 1000),
      name: index % 10 === 0 ? `benchmark room ${index}` : `room ${index}`,
    })),
    ai_responses: Array.from({ length: BENCHMARK_SIZE }, (_, index) => ({
      userId: index % 10 === 0 ? userId : new mongoose.Types.ObjectId(),
      timestamp: new Date(benchmarkDate.getTime() + index * 1000),
      response: `Benchmark response ${index}`,
    })),
  };
}

async function ensureCollections() {
  const database = mongoose.connection.db;
  for (const collectionName of INDEX_COLLECTIONS) {
    try {
      await database.createCollection(collectionName);
    } catch (error) {
      if (error.codeName !== "NamespaceExists") {
        throw error;
      }
    }
  }
}

async function seedBenchmarkData() {
  const documents = buildBenchmarkDocuments();
  for (const [collectionName, rows] of Object.entries(documents)) {
    await schemas[collectionName].deleteMany({ _benchmark: true });
    await schemas[collectionName].insertMany(
      rows.map((row) => ({ ...row, _benchmark: true })),
      { ordered: false },
    );
  }
}

async function explainQuery(query) {
  let explain;
  try {
    explain = await query.model
      .find(query.filter)
      .sort(query.sort || {})
      .limit(query.limit || 0)
      .lean()
      .explain("executionStats");
  } catch (error) {
    return {
      query: query.name,
      queryTimeMs: null,
      documentsScanned: null,
      efficiency: null,
      winningPlan: "unavailable",
      error: error.message,
    };
  }

  const stats = explain.executionStats;
  const documentsExamined = stats.totalDocsExamined || 0;
  const documentsReturned = stats.nReturned || 0;

  return {
    query: query.name,
    queryTimeMs: stats.executionTimeMillis,
    documentsScanned: documentsExamined,
    efficiency: documentsExamined === 0
      ? documentsReturned === 0 ? null : 100
      : (documentsReturned / documentsExamined) * 100,
    winningPlan: stats.executionStages?.stage || "unknown",
  };
}

function formatMetric(value, suffix = "") {
  return value === null || value === undefined
    ? "N/A"
    : `${Number(value).toFixed(value % 1 === 0 ? 0 : 2)}${suffix}`;
}

function printResults(before, after) {
  const rows = before.map((beforeResult, index) => {
    const afterResult = after[index];
    const timeImprovement = typeof beforeResult.queryTimeMs !== "number" || beforeResult.queryTimeMs === 0
      ? null
      : ((beforeResult.queryTimeMs - afterResult.queryTimeMs) / beforeResult.queryTimeMs) * 100;

    return {
      Query: beforeResult.query,
      "Before ms": formatMetric(beforeResult.queryTimeMs),
      "After ms": formatMetric(afterResult.queryTimeMs),
      "Before scanned": beforeResult.documentsScanned,
      "After scanned": afterResult.documentsScanned,
      "Before efficiency": formatMetric(beforeResult.efficiency, "%"),
      "After efficiency": formatMetric(afterResult.efficiency, "%"),
      "Time improvement": formatMetric(timeImprovement, "%"),
      "Before note": beforeResult.error || "",
    };
  });

  console.log("\nMongoDB index benchmark (executionStats)\n");
  console.table(rows);
  console.log("Efficiency = returned documents / scanned documents * 100.");
  console.log("N/A means MongoDB examined zero documents, so efficiency is not meaningful.");
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await ensureCollections();

  const shouldSeed = process.argv.includes("--seed") || process.env.INDEX_BENCHMARK_SEED === "true";
  if (shouldSeed) {
    await dropAllNonIdIndexes();
    await seedBenchmarkData();
  }

  await dropAllNonIdIndexes();
  const before = await Promise.all(queries.map(explainQuery));

  await createIndexes();
  const after = await Promise.all(queries.map(explainQuery));
  printResults(before, after);
}

try {
  await main();
} catch (error) {
  console.error(`Index benchmark failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
