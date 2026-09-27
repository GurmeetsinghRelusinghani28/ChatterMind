import "dotenv/config";
import mongoose from "mongoose";

export const INDEX_DEFINITIONS = {
  users: [
    {
      key: { email: 1 },
      options: { unique: true, name: "users_email_unique" },
    },
    {
      key: { username: 1 },
      options: { name: "users_username" },
    },
  ],
  messages: [
    {
      key: { roomId: 1, createdAt: -1 },
      options: { name: "messages_room_createdAt" },
    },
    {
      key: { userId: 1 },
      options: { name: "messages_userId" },
    },
  ],
  chatrooms: [
    {
      key: { ownerId: 1, createdAt: -1 },
      options: { name: "chatrooms_owner_createdAt" },
    },
    {
      key: { name: "text" },
      options: { name: "chatrooms_name_text" },
    },
  ],
  ai_responses: [
    {
      key: { userId: 1, timestamp: -1 },
      options: { name: "ai_responses_user_timestamp" },
    },
  ],
};

export const INDEX_COLLECTIONS = Object.keys(INDEX_DEFINITIONS);

function getDb(db = mongoose.connection.db) {
  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }

  return db;
}

async function listIndexes(collection) {
  try {
    return await collection.listIndexes().toArray();
  } catch (error) {
    if (error.codeName === "NamespaceNotFound") {
      return [];
    }

    throw error;
  }
}

export async function createIndexes(db) {
  const database = getDb(db);
  const results = {};

  for (const [collectionName, definitions] of Object.entries(INDEX_DEFINITIONS)) {
    const collection = database.collection(collectionName);
    const existingIndexes = await listIndexes(collection);
    results[collectionName] = [];

    for (const { key, options } of definitions) {
      const equivalentIndex = existingIndexes.find(
        (index) => JSON.stringify(index.key) === JSON.stringify(key),
      );

      if (equivalentIndex && equivalentIndex.name !== options.name) {
        await collection.dropIndex(equivalentIndex.name);
      }

      const indexName = await collection.createIndex(key, options);
      results[collectionName].push(indexName);
    }
  }

  return results;
}

export async function dropAllNonIdIndexes(db) {
  const database = getDb(db);
  const dropped = {};

  for (const collectionName of INDEX_COLLECTIONS) {
    const collection = database.collection(collectionName);
    const indexes = await listIndexes(collection);
    const removable = indexes
      .map((index) => index.name)
      .filter((name) => name !== "_id_");

    dropped[collectionName] = [];
    for (const indexName of removable) {
      await collection.dropIndex(indexName);
      dropped[collectionName].push(indexName);
    }
  }

  return dropped;
}

export async function recreateIndexes(db) {
  await dropAllNonIdIndexes(db);
  return createIndexes(db);
}
