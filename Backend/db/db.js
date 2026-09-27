import mongoose from "mongoose";
import { observeDbQuery } from "../monitoring/metrics.js";
// import dotenv from 'dotenv';
// dotenv.config();

async function connect() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            authSource: process.env.MONGODB_AUTH_SOURCE || "admin",
            monitorCommands: true,
        });
        const mongoClient = mongoose.connection.getClient();
        const startedCommands = new Map();
        mongoClient.on("commandStarted", (event) => {
            startedCommands.set(event.requestId, {
                command: event.commandName,
                startedAt: process.hrtime.bigint(),
            });
        });
        const observeCommand = (event) => {
            const started = startedCommands.get(event.requestId);
            if (!started) return;
            startedCommands.delete(event.requestId);
            observeDbQuery(
                started.command,
                Number(process.hrtime.bigint() - started.startedAt) / 1e9,
            );
        };
        mongoClient.on("commandSucceeded", observeCommand);
        mongoClient.on("commandFailed", observeCommand);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        if (error?.code === 18 || error?.message?.includes("bad auth")) {
            console.error(
                "MongoDB rejected the credentials. Verify the Atlas database username/password and authSource=admin.",
            );
        }
        throw error;
    }
}

export default connect;