import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  googleAiKey: process.env.GOOGLE_AI_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
