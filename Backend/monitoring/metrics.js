import client from "prom-client";

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "chattermind_" });

export const httpRequestsTotal = new client.Counter({
  name: "chattermind_http_requests_total",
  help: "Total HTTP requests processed",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpErrorsTotal = new client.Counter({
  name: "chattermind_http_errors_total",
  help: "Total HTTP 4xx and 5xx responses",
  labelNames: ["method", "route", "status_class"],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: "chattermind_http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbQueriesTotal = new client.Counter({
  name: "chattermind_db_queries_total",
  help: "MongoDB commands observed",
  labelNames: ["command"],
  registers: [register],
});

export const dbQueryDuration = new client.Histogram({
  name: "chattermind_db_query_duration_seconds",
  help: "MongoDB command latency in seconds",
  labelNames: ["command"],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const websocketActive = new client.Gauge({
  name: "chattermind_websocket_active_connections",
  help: "Current active Socket.io connections",
  registers: [register],
});

export const websocketConnectedTotal = new client.Counter({
  name: "chattermind_websocket_connected_total",
  help: "Total Socket.io connections",
  registers: [register],
});

export const websocketDisconnectedTotal = new client.Counter({
  name: "chattermind_websocket_disconnected_total",
  help: "Total Socket.io disconnections",
  registers: [register],
});

export const chatMessageDelay = new client.Histogram({
  name: "chattermind_chat_message_delay_seconds",
  help: "Delay between a client message timestamp and server receipt",
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 5],
  registers: [register],
});

export const aiResponseDuration = new client.Histogram({
  name: "chattermind_ai_response_duration_seconds",
  help: "AI response generation latency in seconds",
  labelNames: ["operation"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register],
});

export const redisErrorsTotal = new client.Counter({
  name: "chattermind_redis_errors_total",
  help: "Redis errors observed by the cache service",
  registers: [register],
});

export function observeHttpRequest({ method, route, status, durationSeconds }) {
  const labels = { method, route: route || "unknown", status: String(status) };
  httpRequestsTotal.inc(labels);
  httpRequestDuration.observe(labels, durationSeconds);
  if (status >= 400) {
    httpErrorsTotal.inc({
      method,
      route: route || "unknown",
      status_class: `${Math.floor(status / 100)}xx`,
    });
  }
}

export function observeDbQuery(command, durationSeconds) {
  dbQueriesTotal.inc({ command });
  dbQueryDuration.observe({ command }, durationSeconds);
}

export function observeAiResponse(operation, durationSeconds) {
  aiResponseDuration.observe({ operation }, durationSeconds);
}

export function observeChatMessageDelay(timestamp) {
  const receivedAt = Date.now();
  const sentAt = Date.parse(timestamp);
  if (Number.isFinite(sentAt) && sentAt <= receivedAt) {
    chatMessageDelay.observe((receivedAt - sentAt) / 1000);
  }
}

export function getMetricsText() {
  return register.metrics();
}

export async function getMetricsJson() {
  return register.getMetricsAsJSON();
}

export function startTerminalMetrics(intervalMs = 30000) {
  if (process.env.METRICS_TERMINAL === "false") return undefined;
  return setInterval(async () => {
    const metrics = await getMetricsJson();
    const selected = metrics.filter(({ name }) => [
      "chattermind_http_requests_total",
      "chattermind_http_errors_total",
      "chattermind_http_request_duration_seconds",
      "chattermind_websocket_active_connections",
      "chattermind_ai_response_duration_seconds",
    ].includes(name));
    console.log("[metrics]", JSON.stringify(selected));
  }, intervalMs);
}

export { register };
