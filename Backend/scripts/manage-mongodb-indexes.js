import "dotenv/config";
import mongoose from "mongoose";
import {
  createIndexes,
  dropAllNonIdIndexes,
  recreateIndexes,
} from "./mongodb-indexes.js";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not configured");
}

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const command = process.argv[2] || "create";
  const result = command === "drop"
    ? await dropAllNonIdIndexes()
    : command === "recreate"
      ? await recreateIndexes()
      : await createIndexes();

  console.table(
    Object.entries(result).flatMap(([collection, indexes]) =>
      indexes.map((index) => ({ collection, index })),
    ),
  );
} finally {
  await mongoose.disconnect();
}
