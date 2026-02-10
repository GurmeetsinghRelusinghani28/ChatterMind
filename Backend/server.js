import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";
import { generateProjectFileTree } from "./services/generator.service.js";

const port = process.env.PORT || 3000;

console.log("🚀 Server setup starting...");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }

    socket.project = await projectModel.findById(projectId);

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    socket.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
});

let codeContent = "";
io.on("connection", (socket) => {
  socket.roomId = socket.project._id.toString();
  console.log("a user connected", socket._id);
  socket.join(socket.roomId);

  socket.emit("loadCode", codeContent);




// In your socket.io connection handler
socket.on("project-message", async (data) => {
  try {
    console.log("📩 Received message:", data);
    
    // Broadcast to other users
    socket.broadcast.to(socket.roomId).emit("project-message", data);
    
    // Check if message is for AI
    if (data.message && data.message.toLowerCase().includes('@ai')) {
      const prompt = data.message.replace(/@ai/gi, '').trim();
      
      if (!prompt) return;
      
      console.log("🤖 AI Prompt:", prompt);
      
      // Generate project files
      const result = await generateProjectFileTree(prompt);
      
      // Send AI response
      io.to(socket.roomId).emit("project-message", {
        message: JSON.stringify({
          type: "ai-response",
          plan: result.plan,
          fileTree: result.fileTree,
          text: `I've generated a ${Object.keys(result.fileTree).length} file project based on your request: "${prompt}"`
        }),
        sender: {
          _id: "ai",
          email: "AI Assistant"
        }
      });
      
      // Update project in database
      try {
        await projectModel.findByIdAndUpdate(
          projectId,
          { fileTree: result.fileTree },
          { new: true }
        );
      } catch (dbError) {
        console.error("Database update error:", dbError);
      }
    }
    
  } catch (error) {
    console.error("❌ Error in project-message:", error);
    
    // Send error message
    socket.emit("project-message", {
      message: JSON.stringify({
        type: "error",
        text: `AI Error: ${error.message}`
      }),
      sender: {
        _id: "ai",
        email: "AI Assistant"
      }
    });
  }
});

  socket.on("saveCode", async () => {
    await projectModel.findOneAndUpdate(
      {},
      { fileTree: codeContent },
      { upsert: true },
    );
    io.emit("savedCode", codeContent);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    socket.leave(socket.roomId);
  });
});

server.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
