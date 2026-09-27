# SOEN Interview Preparation Pack

## SECTION 1: PROJECT UNDERSTANDING

### 1. Simple Explanation

SOEN is a full-stack collaborative AI coding platform. A user can register, log in, create coding projects, add collaborators, chat in real time, ask AI to generate project files using `@ai`, edit the generated code in the browser, save the file tree to MongoDB, and run the project live using WebContainer.

In simple words: it is like a lightweight browser-based coding workspace with real-time chat and AI code generation.

### 2. Problem It Solves

Many beginners or small teams struggle to quickly convert an idea into runnable code, collaborate in one place, and preview work without setting up a local environment. This project solves that by combining authentication, project management, real-time collaboration, AI generation, code editing, persistence, and browser-based preview in one application.

### 3. Business Value

The business value is faster prototyping and easier collaboration. A student, developer, or small team can create a project idea, ask AI to generate a starter app, invite teammates, edit files together, and run the output quickly. This reduces setup time and makes coding more accessible.

### 4. Real-World Usefulness

This idea is useful for online coding platforms, hackathons, educational tools, AI coding assistants, pair-programming products, and internal prototyping systems. The same architecture can evolve into a production system similar to a collaborative IDE plus AI assistant.

### 5. Complete Architecture

Current architecture:

```text
React + Vite Frontend
  | REST via Axios
  | Realtime via Socket.IO Client
  v
Node.js + Express Backend
  | JWT auth
  | Controllers/services/models
  | Socket.IO rooms
  | Gemini AI generation
  v
MongoDB
  - users
  - projects with fileTree

Browser Runtime:
  WebContainer mounts fileTree and runs HTML/Node/React projects.
```

Main modules:

- Frontend: login/register, protected routes, home/project screens, chat UI, file explorer, code editor, preview modal.
- Backend: auth APIs, project APIs, AI APIs, socket gateway, MongoDB connection.
- Database: users and projects.
- AI pipeline: planner agent, coder agent, reviewer agent, generator service.
- Runtime preview: WebContainer API.

### 6. Data Flow From Start To End

1. User registers or logs in from React.
2. Frontend sends credentials to Express using Axios.
3. Backend validates input, hashes or compares password using bcrypt, and returns JWT.
4. Frontend stores token in `localStorage`.
5. User creates a project.
6. Backend stores project in MongoDB with creator/collaborator IDs and empty `fileTree`.
7. User opens project workspace.
8. Frontend fetches project data and connects Socket.IO using JWT and `projectId`.
9. Backend validates socket token and joins the user to a room named by project ID.
10. User sends chat messages. Other collaborators receive them in real time.
11. If message contains `@ai`, backend calls the Gemini-based generation pipeline.
12. AI returns a plan and `fileTree`.
13. Backend broadcasts AI response and saves the `fileTree` to MongoDB.
14. Frontend renders the file tree, allows editing, and saves updates back to MongoDB.
15. WebContainer mounts the file tree and runs or previews the project in the browser.

### 7. Technologies Used And Why

- React: component-based frontend for interactive UI.
- Vite: fast development server and optimized frontend build.
- React Router: page routing for login, register, home, project, and preview routes.
- Axios: clean REST API calls with token interceptor.
- Socket.IO: real-time bidirectional communication for project chat.
- Node.js: JavaScript runtime for backend.
- Express: lightweight backend framework for REST APIs.
- MongoDB: flexible document database, good fit for JSON-like `fileTree`.
- Mongoose: schema modeling and MongoDB query layer.
- JWT: stateless authentication between frontend/backend and socket connection.
- bcrypt: password hashing before storing credentials.
- Google Gemini API: AI code generation.
- WebContainer: runs generated projects inside the browser.
- highlight.js: syntax highlighting in code view.
- markdown-to-jsx: renders AI markdown responses.
- Tailwind CSS / utility styling: quick responsive UI styling.

## SECTION 2: 60-90 SECOND PROJECT INTRODUCTION

Using STAR method:

During my project work, I wanted to solve a common problem faced by students and beginner developers: when we have an app idea, it takes time to set up files, write boilerplate, collaborate with others, and run the project locally. So I built ChatterMind, a full-stack collaborative AI coding platform.

My task was to create a system where users could register, create projects, invite collaborators, chat in real time, ask AI to generate code, edit files in the browser, save progress, and preview the output without leaving the app.

I built the frontend using React and Vite, and the backend using Node.js, Express, MongoDB, JWT authentication, and Socket.IO. MongoDB stores users and projects, including a `fileTree` object that represents the project files. For AI generation, I integrated Google Gemini with a planner, coder, and reviewer flow. When a user types `@ai` in the project chat, the backend generates a project file tree, saves it, and sends it back to all collaborators. On the frontend, the files can be edited and run using WebContainer.

The result is a working prototype of an AI-powered collaborative coding workspace. Through this project, I learned authentication, real-time communication, database design, AI integration, and how frontend, backend, sockets, and browser-based runtime execution work together in a real application.

## SECTION 3: 30 SECOND SHORT VERSION

SOEN is a full-stack AI collaborative coding platform built with React, Node.js, Express, MongoDB, Socket.IO, JWT, Gemini AI, and WebContainer. Users can log in, create projects, add collaborators, chat in real time, ask AI to generate code using `@ai`, edit the generated files, save them to MongoDB, and run the project directly in the browser. The main learning was connecting authentication, real-time sockets, AI generation, database persistence, and live code preview into one end-to-end application.

## SECTION 4: DETAILED WALKTHROUGH

The problem I targeted was that project setup and collaboration can be slow for beginners. A user may have an idea but must manually create files, install dependencies, invite teammates, and configure preview before seeing output.

SOEN solves this by providing an authenticated browser workspace. The frontend is React with Vite. It has login, register, home, and project workspace screens. The backend is Node.js and Express with MongoDB. Authentication uses JWT and bcrypt. Project data is stored in MongoDB. Real-time chat uses Socket.IO rooms, where each project gets its own room.

The most important data structure is `fileTree`. It is a JSON representation of files and folders. AI generates it, MongoDB stores it, React renders it, the editor modifies it, and WebContainer runs it.

Core features include user registration/login, project creation, collaborator addition, project-specific real-time chat, AI code generation through `@ai`, file explorer, code editing, save-to-database, and live preview for HTML, Node, or React-style projects.

Implementation-wise, routes map to controllers, controllers call services, services interact with Mongoose models, and frontend Axios calls backend APIs. For sockets, the frontend sends token and project ID. Backend verifies both, joins the room, and broadcasts messages. AI flow uses planner, coder, and reviewer agents to produce a usable file tree.

Challenges included managing auth across REST and sockets, keeping the file tree format consistent, handling AI JSON output safely, saving edited code, and running user-generated projects in the browser. Testing is mostly manual right now: register/login, create project, add users, send chat, generate files, edit, save, refresh, and preview.

For deployment, the current app can run as separate frontend and backend services, with MongoDB Atlas and environment variables like `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_AI_KEY`, and `VITE_API_URL`. Future improvements include Redis caching, BullMQ async AI jobs, better authorization, persisted chat, Docker, CI/CD, logging, monitoring, and scalable Socket.IO using a Redis adapter.

## SECTION 5: TECHNICAL INTERVIEW QUESTIONS

Format: Beginner answer, interview-level answer, follow-ups.

### A. Project Overview Questions

1. What is SOEN?
Beginner: It is a web app where users can collaborate on coding projects and use AI to generate code.
Interview-level: SOEN is a MERN-style collaborative AI coding workspace with React frontend, Express backend, MongoDB persistence, Socket.IO real-time communication, Gemini AI code generation, and WebContainer browser preview.
Follow-ups: What is the core module? How is it different from a normal chat app?

2. What are the main features?
Beginner: Login, project creation, collaboration, chat, AI code generation, editing, and preview.
Interview-level: It supports JWT auth, project CRUD, collaborator management, project-room chat, `@ai` code generation, file tree persistence, code editing, syntax highlighting, and live preview using WebContainer.
Follow-ups: Which feature was hardest? Which feature is most business-critical?

3. What is the most important data structure?
Beginner: The `fileTree`.
Interview-level: `fileTree` is a JSON filesystem abstraction. It stores nested files as objects like `{ "index.html": { "file": { "contents": "..." }}}`, enabling AI output, DB storage, editor rendering, and runtime mounting.
Follow-ups: How do you handle nested files? Why JSON instead of real files?

4. Who can use this app?
Beginner: Students, developers, and teams.
Interview-level: It targets beginners, hackathon teams, educators, and small teams who want AI-assisted project bootstrapping plus collaboration in a browser.
Follow-ups: What is the target market? How can this become a SaaS?

### B. Architecture Questions

5. Explain the architecture.
Beginner: React frontend talks to Express backend, backend talks to MongoDB and AI.
Interview-level: The frontend uses Axios for REST and Socket.IO client for real-time events. Express exposes user, project, and AI routes. Socket.IO handles room-based project chat. Mongoose persists users and projects. Gemini generates code. WebContainer runs generated files in the browser.
Follow-ups: Why separate REST and sockets? Where does WebContainer fit?

6. Why this architecture?
Beginner: It is simple and suitable for a full-stack app.
Interview-level: A modular monolith is appropriate for this stage because the app has multiple domains but not enough scale to justify microservices. REST handles request-response operations, Socket.IO handles live collaboration, and MongoDB fits dynamic file trees.
Follow-ups: When would you split services? What are scaling limits?

7. What is the backend design pattern?
Beginner: Routes, controllers, services, and models.
Interview-level: The backend follows a layered pattern: routes map endpoints, controllers validate and shape responses, services contain business logic, and Mongoose models handle persistence.
Follow-ups: Why use services? What is a repository layer?

8. What are current architecture limitations?
Beginner: It needs better scaling and security.
Interview-level: AI runs synchronously, sockets are single-instance oriented, chat is not persisted, project authorization is basic, some frontend auth bootstrapping is incomplete, and production observability is missing.
Follow-ups: How would you fix each? What is the first priority?

### C. Frontend Questions

9. Why React?
Beginner: React makes UI development easier.
Interview-level: React is good for this project because the UI has many stateful parts: auth context, project list, chat messages, file tree, open files, editor state, preview modal, and socket events.
Follow-ups: Why not Angular? How do you manage state?

10. Why Vite?
Beginner: It is fast.
Interview-level: Vite gives fast dev startup, hot reload, and optimized builds, which improves development speed for a React project.
Follow-ups: Difference between Vite and CRA? What does Vite use internally?

11. How does protected routing work?
Beginner: It checks if user is logged in.
Interview-level: The app stores JWT in localStorage and user state in context. Protected routes use an auth wrapper. A production version should restore user state from `/users/profile` when a token exists.
Follow-ups: What issue exists currently? How would you fix refresh behavior?

12. How do you call backend APIs?
Beginner: Using Axios.
Interview-level: A configured Axios instance reads `VITE_API_URL`, attaches `Authorization: Bearer <token>`, and redirects on 401 by clearing token.
Follow-ups: What are interceptors? Why centralize API config?

13. How is chat implemented on frontend?
Beginner: It uses Socket.IO client.
Interview-level: Project page initializes a socket with project ID and token, listens for `project-message`, appends received messages to React state, and emits messages when user sends.
Follow-ups: How do you avoid duplicate listeners? What happens on unmount?

14. How does the editor work?
Beginner: It shows files and lets users edit them.
Interview-level: The file explorer recursively renders the `fileTree`. Clicking a file opens it in tabs. The code area uses `contentEditable`, `highlight.js`, and on blur updates the file tree and sends it to backend.
Follow-ups: Why is contentEditable risky? What better editor library could you use?

15. How does preview work?
Beginner: It runs the files in the browser.
Interview-level: For HTML projects it creates a blob URL. For Node/React projects, WebContainer mounts the file tree, runs `npm install`, starts `npm start` or `npm run dev`, and loads the server-ready URL in an iframe.
Follow-ups: What are WebContainer limitations? How do you sandbox output?

### D. Backend Questions

16. Why Node.js?
Beginner: It uses JavaScript on backend.
Interview-level: Node.js works well for I/O-heavy apps with REST APIs, sockets, DB calls, and external AI API calls. It also keeps one language across frontend and backend.
Follow-ups: Is Node good for CPU-heavy tasks? How to handle heavy work?

17. Why Express?
Beginner: It is simple for APIs.
Interview-level: Express provides lightweight middleware-based routing for auth, projects, validation, CORS, JSON parsing, and error handling.
Follow-ups: What middleware did you use? How do controllers work?

18. How is server startup handled?
Beginner: Backend connects DB and starts server.
Interview-level: `app.js` configures middleware and routes. `server.js` creates HTTP server, attaches Socket.IO, authenticates sockets, and listens on the configured port.
Follow-ups: Why use HTTP server with Express? Why not `app.listen`?

19. What middlewares are used?
Beginner: CORS, JSON parser, auth.
Interview-level: The backend uses `cors`, `morgan`, `express.json`, `express.urlencoded`, `cookie-parser`, express-validator, and custom JWT auth middleware.
Follow-ups: Why CORS? Why morgan?

20. How do services help?
Beginner: They keep logic separate.
Interview-level: Services keep business/database logic out of controllers, making handlers cleaner and easier to test or refactor.
Follow-ups: What logic belongs in controller vs service?

### E. Database Questions

21. Why MongoDB?
Beginner: It stores JSON-like data.
Interview-level: MongoDB fits because project `fileTree` is dynamic and document-shaped. Different AI-generated projects can have different files and nested structures without schema migrations.
Follow-ups: Why not PostgreSQL? What are MongoDB drawbacks?

22. What collections exist?
Beginner: Users and projects.
Interview-level: `users` stores email and hashed password. `projects` stores name, collaborators in `users`, and `fileTree`.
Follow-ups: What additional collections would you add?

23. How is password stored?
Beginner: It is hashed.
Interview-level: Password is hashed with bcrypt and stored with `select: false`, so it is not returned by default in Mongoose queries.
Follow-ups: Why bcrypt? What is salting?

24. How do you fetch projects for a user?
Beginner: Find projects containing the user ID.
Interview-level: Query projects where `users` array contains `req.user._id`. In production, index `users` and return summaries without heavy `fileTree`.
Follow-ups: Why avoid returning fileTree in list? How to paginate?

25. How do you prevent duplicate collaborators?
Beginner: Use MongoDB add-to-set.
Interview-level: Backend can use `$addToSet` with `$each` so the same user ID is not inserted multiple times.
Follow-ups: What permission check is missing? How to validate user IDs?

### F. API Questions

26. Main user APIs?
Beginner: Register, login, profile, logout, all users.
Interview-level: `POST /users/register`, `POST /users/login`, `GET /users/profile`, `GET /users/logout`, `GET /users/all`.
Follow-ups: Which are protected? What should logout do with JWT?

27. Main project APIs?
Beginner: Create project, list projects, add users, get project, update file tree.
Interview-level: `POST /projects/create`, `GET /projects/all`, `PUT /projects/addusers`, `GET /projects/get-project/:projectId`, `PUT /projects/update-file-tree`.
Follow-ups: How would you make routes more RESTful?

28. Main AI APIs?
Beginner: Generate AI result.
Interview-level: `GET /ai/get-result` and `POST /ai/generate-project`, plus chat-triggered generation through Socket.IO when a message includes `@ai`.
Follow-ups: Which should be async? How to track job status?

29. How are validation errors handled?
Beginner: Backend validates inputs.
Interview-level: It uses express-validator in user/project routes. A stronger version would centralize validation schemas and global error handling.
Follow-ups: Why validate on backend even if frontend validates?

### G. Authentication Questions

30. How does authentication work?
Beginner: User logs in and gets a token.
Interview-level: Register/login returns a JWT containing user ID and email. Frontend stores it, Axios attaches it, backend verifies it in auth middleware, and sockets verify it during handshake.
Follow-ups: What is JWT structure? Where is secret stored?

31. Why JWT?
Beginner: It is easy for APIs.
Interview-level: JWT supports stateless authentication, which is useful for REST and socket handshakes. The server can verify token without DB session lookup.
Follow-ups: What are JWT disadvantages? How to revoke tokens?

32. Why bcrypt?
Beginner: For secure password hashing.
Interview-level: bcrypt is slow by design and includes salt, making brute-force attacks harder than plain hashing.
Follow-ups: What is salt round? Why not store plain password?

33. Where is token stored?
Beginner: localStorage.
Interview-level: Current implementation uses localStorage. A production setup should use short-lived access tokens and refresh tokens in httpOnly secure cookies.
Follow-ups: localStorage risk? What is XSS?

### H. Security Questions

34. What security is implemented?
Beginner: Password hashing and JWT.
Interview-level: Passwords are bcrypt-hashed, JWT protects APIs, socket connections validate token, CORS restricts origins, and password is hidden by default in queries.
Follow-ups: What is missing?

35. What security improvements are needed?
Beginner: More validation and rate limits.
Interview-level: Add Helmet, Redis-backed rate limiting, refresh tokens, stricter project authorization, AI quota limits, prompt size limits, audit logs, and sanitized rendering.
Follow-ups: How to protect AI endpoint from abuse?

36. Can any collaborator update project files?
Beginner: Currently project users can work on files.
Interview-level: The app should enforce membership/role checks before reading or updating file trees. Current implementation needs stronger ownership and permission validation.
Follow-ups: How to design roles?

### I. Performance Questions

37. What can become slow?
Beginner: AI generation and large files.
Interview-level: Synchronous AI calls, large `fileTree` payloads, repeated DB reads, unpaginated user/project lists, and WebContainer dependency installs can affect performance.
Follow-ups: How to optimize each?

38. How to optimize project list?
Beginner: Return only needed fields.
Interview-level: Use MongoDB indexes, `.select("_id name users updatedAt")`, pagination, sorting by `updatedAt`, and avoid returning full `fileTree`.
Follow-ups: What is indexing?

39. Where would you use caching?
Beginner: Cache project details and user profile.
Interview-level: Redis can cache user profiles, project summaries, collaborator lists, and short-lived project details. Invalidate cache when collaborators or file tree changes.
Follow-ups: Cache invalidation strategy?

### J. Deployment Questions

40. How would you deploy it?
Beginner: Deploy frontend and backend separately.
Interview-level: Build frontend and serve via Vercel/Netlify/CDN. Deploy backend on Render/AWS, use MongoDB Atlas, set env vars, configure CORS, and use HTTPS.
Follow-ups: What env vars are required?

41. Required environment variables?
Beginner: DB URL, JWT secret, AI key.
Interview-level: Backend needs `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_AI_KEY`, optional `PORT`. Frontend needs `VITE_API_URL`.
Follow-ups: How to store secrets safely?

42. What is CORS?
Beginner: It controls which frontend can call backend.
Interview-level: CORS is a browser security mechanism. Backend allows specific origins like local Vite and deployed frontend.
Follow-ups: Why avoid `*` in production?

### K. DevOps Questions

43. What CI/CD would you add?
Beginner: Run lint, tests, build, deploy.
Interview-level: GitHub Actions pipeline: install dependencies, lint, unit tests, integration tests, frontend build, backend build, Docker image build, security scan, staging deploy, smoke test, production deploy.
Follow-ups: What should block deployment?

44. Why Docker?
Beginner: It makes deployment consistent.
Interview-level: Docker packages runtime, dependencies, and configuration so API, worker, and socket services run consistently across local, staging, and production.
Follow-ups: What would be in Dockerfile?

45. What monitoring would you add?
Beginner: Logs and error tracking.
Interview-level: Add structured logs with Pino/Winston, Sentry errors, Prometheus metrics, queue depth, socket connection count, API latency, DB latency, and AI job success rate.
Follow-ups: What metrics matter most?

### L. Cloud Questions

46. Which cloud services would fit?
Beginner: Vercel, Render, MongoDB Atlas.
Interview-level: Simple path: Vercel/Netlify frontend, Render backend, MongoDB Atlas, Upstash Redis. AWS path: S3/CloudFront, ECS/Fargate, ALB, ElastiCache, Secrets Manager.
Follow-ups: How would you scale on AWS?

47. Why CDN for frontend?
Beginner: Faster static file delivery.
Interview-level: Frontend build assets are static and should be served from CDN to reduce backend load and improve global latency.
Follow-ups: What files are cached?

### M. AI/ML Questions

48. How is AI integrated?
Beginner: Backend calls Gemini.
Interview-level: User prompt is sent to a generator service that coordinates planner, coder, and reviewer agents. Final output is normalized into `fileTree` and returned through socket or HTTP.
Follow-ups: Why multiple agents? How do you handle invalid AI output?

49. What does planner agent do?
Beginner: It plans files.
Interview-level: It converts the user prompt into a structured plan and expected file list before code generation.
Follow-ups: Why not directly generate code?

50. What does coder agent do?
Beginner: It writes code.
Interview-level: It uses the plan to generate file contents in the required `fileTree` JSON format.
Follow-ups: How to ensure valid JSON?

51. What does reviewer agent do?
Beginner: It checks the code.
Interview-level: It reviews and cleans the generated output, improving consistency and reducing malformed file tree issues.
Follow-ups: What if reviewer fails?

52. How would you make AI production-ready?
Beginner: Use queue and limits.
Interview-level: Move AI to BullMQ workers, store `ai_jobs`, add retries, rate limits, prompt length checks, per-user quotas, logging, and socket completion events.
Follow-ups: Why async jobs? How to handle provider failure?

## SECTION 6: DEEP FOLLOW-UP QUESTIONS

Why React? Because the workspace is highly interactive and state-driven: chat, open files, file explorer, editor, preview, modals, and auth context all update frequently.

Why MongoDB instead of PostgreSQL? MongoDB stores dynamic JSON-like `fileTree` naturally. PostgreSQL is stronger for relational transactions, but this project’s main object is flexible nested project files.

Why JWT? JWT gives stateless auth for both REST requests and Socket.IO handshakes. In production I would pair it with httpOnly refresh tokens and token revocation support.

Why Socket.IO? Native WebSocket is lower-level. Socket.IO gives rooms, reconnection, event abstraction, and fallback handling, which are useful for collaboration.

Why WebContainer? It lets generated code run inside the browser, reducing the need for a backend sandbox for every preview. For production, I would still enforce limits and sandboxing.

Why Redis? Redis is not required for MVP, but it is useful for caching, rate limiting, queue backend, presence tracking, and multi-instance Socket.IO pub/sub.

Why Docker? Docker makes runtime consistent and allows separating API, worker, and socket services later.

Why not microservices immediately? The app is still small. A modular monolith gives cleaner code without distributed-system complexity. I would split AI worker and realtime service only when scale demands it.

What alternatives did you consider? PostgreSQL for DB, Firebase for realtime/auth, Monaco editor instead of contentEditable, native WebSocket instead of Socket.IO, OpenAI/other LLMs instead of Gemini, and server-side containers instead of WebContainer.

## SECTION 7: CHALLENGES AND SOLUTIONS

1. Auth across REST and sockets
Problem: Both APIs and sockets need authentication.
Root cause: Socket connections do not automatically share Axios headers.
Solution: Send JWT in socket handshake and verify on backend.
Learning: Real-time auth must be handled separately from REST.

2. File tree consistency
Problem: AI, DB, editor, and preview all need the same structure.
Root cause: AI output can be unpredictable.
Solution: Normalize output into `{ file: { contents } }` format.
Learning: Shared contracts are critical.

3. AI JSON parsing
Problem: LLMs may return invalid JSON.
Root cause: Generative output is probabilistic.
Solution: Use structured prompts, reviewer agent, retry/fallback logic.
Learning: AI responses need validation and fallback.

4. Live preview
Problem: Running generated code safely in browser.
Root cause: Projects may be HTML, Node, or React.
Solution: Detect project type and run through blob URL or WebContainer.
Learning: Runtime environment must match project type.

5. Collaborator duplicates
Problem: Same user can be added multiple times.
Root cause: Array updates can duplicate IDs.
Solution: Use `$addToSet` with `$each`.
Learning: Use database operators for integrity.

6. Project refresh issue
Problem: Direct project URL can fail if state is missing.
Root cause: Page originally depended on router state.
Solution: Support `/project/:id` and fetch project by route ID.
Learning: URLs should be shareable and restorable.

7. Large project payloads
Problem: Project list can become heavy.
Root cause: Returning full `fileTree` for every project.
Solution: Return summaries in list and full detail only when opening project.
Learning: Design APIs by screen need.

8. Synchronous AI latency
Problem: AI generation can block request/socket flow.
Root cause: Gemini call happens directly in event handler.
Solution: Move to BullMQ worker in production.
Learning: Long tasks should be asynchronous.

9. Authorization gaps
Problem: Collaborator actions need stricter checks.
Root cause: MVP focuses on functionality.
Solution: Add role/ownership checks in services.
Learning: AuthN and AuthZ are different.

10. Editor limitations
Problem: `contentEditable` can be fragile.
Root cause: It is not a full code editor.
Solution: Use Monaco or CodeMirror in future.
Learning: Use specialized libraries for complex editing.

## SECTION 8: HR QUESTIONS RELATED TO PROJECT

Why did you build this project?
I built it to understand how a real full-stack collaborative product works, especially authentication, realtime communication, AI integration, and browser-based code execution.

What motivated you?
I wanted to create something more practical than a CRUD app: a tool where users can collaborate and generate working code from ideas.

Biggest challenge?
The biggest challenge was connecting AI-generated file output with the editor, database, and WebContainer preview using one consistent `fileTree` format.

What would you improve?
I would add async AI jobs, Redis caching, persisted chat, stronger authorization, Monaco editor, testing, Docker, and CI/CD.

What would you do differently?
I would design route structure and auth restoration earlier, and use a proper editor component from the beginning.

What was your contribution?
I designed and implemented the full flow: frontend screens, backend APIs, JWT auth, project management, Socket.IO chat, AI generation pipeline, file editor, persistence, and preview.

What did you learn?
I learned how frontend, backend, database, sockets, authentication, AI APIs, and runtime preview connect in a real application.

## SECTION 9: RESUME CROSS QUESTIONING

If resume says "Built AI collaborative coding platform":
Question: What makes it collaborative?
Answer: Project-specific Socket.IO rooms allow users in the same project to exchange real-time messages and receive AI-generated updates.

If resume says "Integrated Gemini AI":
Question: Where exactly is Gemini used?
Answer: In backend AI services. The generator pipeline takes a user prompt, plans files, generates code, reviews output, and returns a normalized `fileTree`.

If resume says "JWT authentication":
Question: How is JWT used?
Answer: Login/register returns a token. Axios sends it for REST calls, and Socket.IO sends it during handshake. Backend verifies it with `JWT_SECRET`.

If resume says "MongoDB":
Question: What schemas did you design?
Answer: User schema with email/password and auth helpers; project schema with name, collaborators, and fileTree.

If resume says "real-time chat":
Question: Are messages persisted?
Answer: Currently no. Messages are real-time only in frontend state. Persisted chat would need a messages collection.

If resume says "live preview":
Question: How do you run code in browser?
Answer: HTML uses blob URL. React/Node projects are mounted and run through WebContainer.

If resume says "performance optimization":
Question: What optimization did you actually implement?
Answer: Current project is MVP-level. Planned optimizations include avoiding heavy fileTree in project lists, indexing users in projects, Redis cache, and async AI jobs.

If resume mentions metrics:
Question: How did you measure them?
Answer: Only mention metrics you can prove. If no real load test was done, say the architecture is designed for future scaling, not that it already supports a large number.

## SECTION 10: SYSTEM DESIGN DISCUSSION

### Current Architecture

Single React frontend, single Express backend, MongoDB, Socket.IO attached to backend server, Gemini called synchronously, WebContainer on frontend.

### Scalability Issues

- AI calls block server flow.
- Socket rooms are in-memory per instance.
- No Redis adapter.
- No queue.
- No caching.
- Large fileTree payloads can slow APIs.
- Missing pagination and observability.

### Scaling By User Count

100 users:
Current architecture is enough. Use MongoDB Atlas, proper env vars, and basic logging.

1,000 users:
Add indexes, pagination, avoid heavy fileTree in list APIs, deploy frontend to CDN, backend to a managed service.

10,000 users:
Add Redis caching, rate limiting, BullMQ AI jobs, separate worker process, better DB indexes, structured logs, and monitoring.

100,000 users:
Separate API and realtime services, use Socket.IO Redis adapter, autoscale workers, use CDN/WAF/load balancer, add read replicas and stricter quotas.

1 million users:
Move to multi-service architecture: API service, socket gateway, AI worker fleet, Redis cluster, MongoDB sharding/replica sets, observability stack, regional deployment, queue-based workflows.

### Database Optimization

Add indexes on `users.email`, `projects.users`, `projects.createdBy`, `projects.updatedAt`. Use projections, pagination, lean queries, and separate summary/detail endpoints.

### Caching Strategy

Use Redis keys like `user:profile:{id}`, `project:list:{userId}`, `project:detail:{projectId}`, and invalidate on project update or collaborator change.

### Load Balancing

Use HTTP load balancer for APIs. For sockets, either use sticky sessions or WebSocket transport with Redis adapter for cross-instance room broadcasting.

### Microservices Migration

Start as modular monolith. Then extract:

- API service: auth, users, projects.
- Realtime service: sockets, rooms, presence.
- AI worker service: Gemini calls and retries.
- Optional notification/audit service.

## SECTION 11: STORYTELLING VERSION

The idea started from a common developer problem: when we get an app idea, the first few hours often go into setup instead of actual building. I wanted to create a platform where a user can describe an idea, generate starter code, collaborate with teammates, edit files, and preview the result in one browser workspace.

I researched how real-time apps work and chose Socket.IO for collaboration. I used React for the frontend, Express for backend APIs, MongoDB for storing users and project file trees, and JWT for authentication. The interesting part was AI integration. I designed a flow where the user types `@ai` in chat, the backend sends the prompt to Gemini, and the result comes back as a structured file tree.

The biggest challenge was making sure that one `fileTree` format worked everywhere: AI output, MongoDB storage, file explorer rendering, editing, and WebContainer preview. Once that was stable, the system became much easier to explain and extend.

The final result is a working prototype of an AI-powered collaborative coding workspace. In future, I would make AI generation asynchronous, add Redis, persist chat messages, improve authorization, and deploy it as separate API, socket, and worker services.

## SECTION 12: MOCK INTERVIEW

We should conduct this interactively, one question at a time. Start with this:

Question 1: Explain your SOEN project in 60 seconds as if I am a technical interviewer.

After you answer, I will score it out of 10, point out mistakes, give an ideal answer, and ask the next question. The planned coverage is:

1. Project overview
2. Architecture
3. Authentication
4. Database design
5. Socket.IO flow
6. AI generation
7. File tree and editor
8. WebContainer preview
9. Security
10. Performance
11. Deployment
12. Scaling/system design
13. HR/project ownership

## SECTION 13: FINAL INTERVIEW CHEAT SHEET

### Top 20 Questions

1. What is SOEN?
2. Why did you build it?
3. Explain the architecture.
4. What is `fileTree`?
5. How does authentication work?
6. Why JWT?
7. Why MongoDB?
8. How does Socket.IO work?
9. How does `@ai` generation work?
10. How do you save edited code?
11. How does preview work?
12. What are the main APIs?
13. What security is implemented?
14. What are current limitations?
15. How would you scale it?
16. Why Redis in future?
17. Why BullMQ in future?
18. What was your biggest challenge?
19. What would you improve?
20. What did you learn?

### Top 20 Short Answers

1. SOEN is an AI-powered collaborative coding workspace.
2. I built it to combine collaboration, AI code generation, editing, and preview.
3. React frontend, Express backend, MongoDB DB, Socket.IO realtime, Gemini AI, WebContainer preview.
4. `fileTree` is a JSON representation of project files.
5. Auth uses bcrypt password hashing and JWT token verification.
6. JWT is stateless and works for REST plus sockets.
7. MongoDB fits dynamic nested file structures.
8. Socket.IO connects users into project-specific rooms.
9. `@ai` triggers backend Gemini generation and broadcasts result.
10. Edited files update `fileTree` and are saved to MongoDB.
11. Preview uses blob URLs for HTML and WebContainer for Node/React.
12. Main APIs are users, projects, and AI routes.
13. Security includes JWT, bcrypt, CORS, and validation.
14. Limitations include synchronous AI, no persisted chat, basic authorization.
15. Scale using Redis, queues, load balancers, workers, and indexes.
16. Redis helps cache, rate-limit, queue, and scale sockets.
17. BullMQ moves slow AI calls out of request/socket path.
18. Biggest challenge was keeping AI file output usable across the app.
19. I would improve editor, tests, deployment, async AI, and auth.
20. I learned end-to-end full-stack system integration.

### Key Metrics To Mention Carefully

- 2 main MongoDB collections: users and projects.
- 2 communication modes: REST APIs and Socket.IO.
- 3-agent AI flow: planner, coder, reviewer.
- 1 central file format: `fileTree`.
- Current stage: strong prototype/MVP, not yet production-scale.

### Architecture Summary

React/Vite calls Express APIs with Axios and connects to Socket.IO for live collaboration. Express validates JWT, manages users/projects, calls Gemini for AI generation, and stores project data in MongoDB. WebContainer runs generated code inside the browser.

### Tech Stack Summary

Frontend: React, Vite, Axios, React Router, Socket.IO client, WebContainer, highlight.js.
Backend: Node.js, Express, Socket.IO, Mongoose, JWT, bcrypt, express-validator.
Database: MongoDB.
AI: Google Gemini.
Future production: Redis, BullMQ, Docker, CI/CD, monitoring.

### Challenges Summary

Auth across REST/socket, AI output normalization, file tree editing, browser preview, collaborator handling, direct route access, performance, and production scalability.

### 30-Second Revision

SOEN is a full-stack AI collaborative coding workspace. Users log in, create projects, invite collaborators, chat in real time, use `@ai` to generate project files, edit those files, save them in MongoDB, and preview them in the browser through WebContainer.

### 5-Minute Revision

Explain problem, architecture, auth, database, socket flow, AI generation, fileTree, editor, preview, limitations, and future scaling. Keep returning to this central idea: `fileTree` connects AI, database, frontend editor, and browser runtime.
