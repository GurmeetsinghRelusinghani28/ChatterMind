import express from "express";
import cors from "cors";
import { env } from "../config/env.js";
import { errorMiddleware } from "../common/middleware/error.middleware.js";
import projectRoutes from "../modules/projects/project.routes.js";

const app = express();

app.use(
  cors({
    origin: [env.frontendUrl],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/projects", projectRoutes);
app.use(errorMiddleware);

export default app;
