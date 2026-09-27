# Phased Implementation Checklist

## Phase 1: Stabilize the current app

Goal:
- fix correctness issues
- improve data model basics
- make auth and routing more reliable
- prepare for modularization

### Current files to update first

#### Backend
- `Backend/server.js`
  - fix undefined `projectId` usage in socket AI flow
  - stop updating arbitrary project in `saveCode`
  - load project-specific file tree instead of shared global variable

- `Backend/models/user.model.js`
  - add timestamps
  - keep auth helpers intact

- `Backend/models/project.model.js`
  - add timestamps
  - add `createdBy`
  - add indexes for collaborators and recency

- `Backend/services/project.service.js`
  - set `createdBy`
  - stop returning heavy file tree in project listing
  - sort by `updatedAt`

- `Backend/controllers/project.controller.js`
  - support cleaner project listing response shape
  - keep compatibility with current frontend

#### Frontend
- `Frontend/src/screens/Register.jsx`
  - fix JSX typo

- `Frontend/src/context/user.context.jsx`
  - add `loading`
  - restore user from `/users/profile` when token exists

- `Frontend/src/auth/UserAuth.jsx`
  - work correctly with loading state

- `Frontend/src/routes/AppRoutes.jsx`
  - move project route to `/project/:id`

- `Frontend/src/screens/Home.jsx`
  - navigate using project id in URL

- `Frontend/src/screens/Project.jsx`
  - support direct URL access
  - stop depending entirely on `location.state`

### Deliverables for Phase 1
- stable login bootstrap
- stable direct project link support
- safer socket project updates
- better project schema

---

## Phase 2: Modularize backend without breaking behavior

Goal:
- convert current backend into a modular monolith

### Migrate these current files into modules

#### Auth module
- current:
  - `Backend/routes/User.routes.js`
  - `Backend/controllers/user.controller.js`
  - `Backend/services/user.service.js`
  - `Backend/models/user.model.js`
  - `Backend/middlewares/auth.middleware.js`

#### Projects module
- current:
  - `Backend/routes/Project.routes.js`
  - `Backend/controllers/project.controller.js`
  - `Backend/services/project.service.js`
  - `Backend/models/project.model.js`

#### AI module
- current:
  - `Backend/routes/ai.routes.js`
  - `Backend/controllers/ai.controller.js`
  - `Backend/services/ai.service.js`
  - `Backend/services/generator.service.js`
  - `Backend/agents/*`
  - `Backend/utils/*`

#### Realtime module
- current:
  - `Backend/server.js`
  - socket auth logic
  - socket event handlers

### New folder targets
- `Backend/src/app`
- `Backend/src/config`
- `Backend/src/common`
- `Backend/src/modules/auth`
- `Backend/src/modules/projects`
- `Backend/src/modules/ai`
- `Backend/src/modules/realtime`

### Deliverables for Phase 2
- route/controller/service/repository split
- standardized error handling
- standardized logger
- cleaner startup structure

---

## Phase 3: Add Redis

Goal:
- enable caching, rate limiting, socket scaling, and job queue support

### Existing files impacted
- `Backend/app.js`
- `Backend/server.js`
- `Backend/routes/*`
- `Backend/controllers/*`

### New files to add
- `Backend/src/config/redis.js`
- `Backend/src/common/middleware/rateLimit.middleware.js`
- `Backend/src/cache/*`

### Redis usage plan
- cache user profile
- cache project details
- cache project list summaries
- store rate-limit counters
- support future BullMQ queue
- support future Socket.IO Redis adapter

---

## Phase 4: Move AI generation to async jobs

Goal:
- remove Gemini calls from request/socket critical path

### Current files to refactor
- `Backend/server.js`
- `Backend/controllers/ai.controller.js`
- `Backend/services/generator.service.js`

### New files to add
- `Backend/src/config/queue.js`
- `Backend/src/modules/ai/ai.job.producer.js`
- `Backend/src/modules/jobs/ai.job.worker.js`
- `Backend/src/modules/ai/aiJob.model.js`

### Deliverables for Phase 4
- job enqueue endpoint
- worker processing
- job status persistence
- socket completion events

---

## Phase 5: Realtime scaling

Goal:
- support multiple socket server instances

### Current files to refactor
- `Backend/server.js`
- `Frontend/src/config/socket.js`

### New files to add
- `Backend/src/modules/realtime/socket.gateway.js`
- `Backend/src/modules/realtime/socket.auth.js`
- `Backend/src/modules/realtime/socket.events.js`

### Deliverables for Phase 5
- Redis adapter
- presence tracking
- multi-instance room broadcasting

---

## Phase 6: Deployment and observability

Goal:
- make the platform operable in production

### New files to add
- `Backend/Dockerfile`
- `Backend/docker-compose.yml`
- `.github/workflows/ci.yml`

### Monitoring additions
- Winston/Pino logger
- Sentry
- Prometheus metrics
- health check endpoints

---

## Suggested implementation order

1. Finish Phase 1 code changes in current repo
2. Start coding inside `Backend/src`
3. Gradually move routes/modules into new structure
4. Add Redis
5. Add BullMQ
6. Split API / worker / socket deployment
