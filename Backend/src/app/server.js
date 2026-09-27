import http from "http";
import app from "./app.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const server = http.createServer(app);

server.listen(env.port, () => {
  logger.info("Starter production server running", { port: env.port });
});
