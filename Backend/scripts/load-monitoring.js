import "dotenv/config";

const baseUrl = process.env.MONITORING_BASE_URL || "http://localhost:8080";
const concurrency = Number(process.env.MONITORING_LOAD_CONCURRENCY || 20);
const durationSeconds = Number(process.env.MONITORING_LOAD_DURATION || 30);
const endAt = Date.now() + durationSeconds * 1000;
let completed = 0;
let failures = 0;
let totalLatencyMs = 0;

async function worker() {
  while (Date.now() < endAt) {
    const startedAt = performance.now();
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (!response.ok) failures += 1;
    } catch {
      failures += 1;
    } finally {
      totalLatencyMs += performance.now() - startedAt;
      completed += 1;
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
console.table({
  baseUrl,
  durationSeconds,
  concurrency,
  completedRequests: completed,
  failures,
  averageLatencyMs: completed ? Number((totalLatencyMs / completed).toFixed(2)) : 0,
  requestsPerSecond: Number((completed / durationSeconds).toFixed(2)),
});
console.log(`Scrape metrics with: curl ${baseUrl}/metrics`);
