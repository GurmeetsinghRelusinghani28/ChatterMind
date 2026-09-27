# MongoDB Indexing Strategy

The index definitions live in `scripts/mongodb-indexes.js`. They use explicit collection names because the current application only has a User and Project Mongoose model; the chat collections are prepared for the following document fields.

| Collection | Index | Purpose |
| --- | --- | --- |
| `users` | `{ email: 1 }` unique | Fast login and duplicate-email protection |
| `users` | `{ username: 1 }` | Username lookup |
| `messages` | `{ roomId: 1, createdAt: -1 }` | Room history ordered by newest message |
| `messages` | `{ userId: 1 }` | User message history |
| `chatrooms` | `{ ownerId: 1, createdAt: -1 }` | Owner room listing ordered by creation time |
| `chatrooms` | `{ name: "text" }` | `$text` room-name search |
| `ai_responses` | `{ userId: 1, timestamp: -1 }` | User AI history ordered by newest response |

The benchmark uses Mongoose queries and `explain("executionStats")`. Efficiency is calculated as:

`nReturned / totalDocsExamined * 100`

## Commands

Run from `Backend` with `MONGODB_URI` configured:

```powershell
npm run indexes
npm run indexes:drop
npm run indexes:recreate
npm run benchmark:indexes
npm run benchmark:indexes:seed
```

`indexes:drop` and the benchmark remove every non-`_id` index from the four strategy collections before measuring. This makes the before/after comparison meaningful, but should only be run against a development or staging database. The `--seed` option inserts `INDEX_BENCHMARK_SIZE` documents (default `5000`) into the four chat-related collections and one user collection. Seed documents are marked with `_benchmark: true` and are not automatically removed after the run.

Optional environment variables:

- `INDEX_BENCHMARK_SIZE`: number of documents per seeded collection.
- `BENCHMARK_ROOM_ID`: ObjectId used for room queries.
- `BENCHMARK_USER_ID`: ObjectId used for user queries.

## Output

The benchmark prints one comparison row per query:

| Query | Before ms | After ms | Before scanned | After scanned | Before efficiency | After efficiency | Time improvement |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Users by email | ... | ... | ... | ... | ... | ... | ... |
| Messages in room by date | ... | ... | ... | ... | ... | ... | ... |
| ChatRooms name text search | ... | ... | ... | ... | ... | ... | ... |

Actual values depend on MongoDB version, dataset size, hardware, and cache state. The `After` execution plan should generally show fewer scanned documents and an indexed winning plan for selective queries.

## Redis Cache Benchmark

Run `npm run benchmark:redis` from `Backend` with both `MONGODB_URI` and Redis configured. It compares repeated profile reads against MongoDB and Redis, then prints average response time, database reads, and cache hit rate. `REDIS_BENCHMARK_ITERATIONS` controls the sample size and defaults to `100`.

The authenticated endpoint `GET /users/cache/metrics` returns dashboard-ready JSON containing hit/miss counts, hit rate, database reads, invalidations, pool health, Redis key count, and memory usage.
