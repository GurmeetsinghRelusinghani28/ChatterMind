# Project Summary

## 1. What this project is

This project is a full-stack MERN-style collaborative coding application.

Main idea:
- Users can register and log in.
- A logged-in user can create projects.
- A project can have multiple collaborators.
- Inside a project, collaborators can chat in real time using Socket.IO.
- If a message mentions `@ai`, the backend calls Google Gemini and generates a project file tree.
- The frontend displays generated files, allows editing them, saves them back to MongoDB, and can run the generated project in the browser using WebContainer.

In short:
- Backend handles authentication, project APIs, AI generation, MongoDB access, and socket events.
- Frontend handles screens, protected routing, calling APIs, chat UI, file editor UI, and live preview.
- MongoDB stores users and projects.

---

## 2. High-level architecture

### Frontend
Location: `Frontend/`

Built with:
- React
- Vite
- Axios
- React Router
- Socket.IO client
- WebContainer API

Frontend responsibilities:
- Login and register UI
- Store JWT token in `localStorage`
- Call backend REST APIs
- Open socket connection for project chat
- Show collaborators
- Show/edit project files
- Run generated code in preview

### Backend
Location: `Backend/`

Built with:
- Node.js
- Express
- Mongoose
- Socket.IO
- JWT
- bcrypt
- Google Generative AI SDK

Backend responsibilities:
- Start Express server
- Connect to MongoDB
- Validate and authenticate users
- Create and fetch projects
- Add collaborators
- Save file tree to database
- Listen for socket chat messages
- Detect `@ai` prompts and generate code

### Database
Database type:
- MongoDB

Collections used:
- `users`
- `projects`

---

## 3. Main backend flow

### App bootstrap
Files:
- `Backend/app.js`
- `Backend/server.js`
- `Backend/db/db.js`

How startup works:
1. `app.js` loads environment variables using `dotenv`.
2. `connect()` from `db/db.js` connects Mongoose to `process.env.MONGODB_URI`.
3. Express middlewares are applied:
   - `cors`
   - `morgan`
   - `express.json`
   - `express.urlencoded`
   - `cookie-parser`
4. REST routes are mounted:
   - `/users`
   - `/projects`
   - `/ai`
5. `server.js` creates an HTTP server from the Express app.
6. Socket.IO is attached to that HTTP server.
7. Socket middleware verifies JWT token and validates `projectId`.
8. Once connected, a user joins a room named with the project `_id`.

### Backend route structure

#### User routes
File: `Backend/routes/User.routes.js`

Routes:
- `POST /users/register`
- `POST /users/login`
- `GET /users/profile`
- `GET /users/logout`
- `GET /users/all`

#### Project routes
File: `Backend/routes/Project.routes.js`

Routes:
- `POST /projects/create`
- `GET /projects/all`
- `PUT /projects/addusers`
- `GET /projects/get-project/:projectId`
- `PUT /projects/update-file-tree`

#### AI routes
File: `Backend/routes/ai.routes.js`

Routes:
- `GET /ai/get-result`
- `POST /ai/generate-project`

---

## 4. Authentication flow

Main files:
- `Backend/models/user.model.js`
- `Backend/controllers/user.controller.js`
- `Backend/services/user.service.js`
- `Backend/middlewares/auth.middleware.js`
- `Frontend/src/screens/Login.jsx`
- `Frontend/src/screens/Register.jsx`
- `Frontend/src/config/axios.js`

### Registration
Flow:
1. Frontend register screen sends `POST /users/register` with `email` and `password`.
2. Backend validates request using `express-validator`.
3. `user.service.js` hashes password using `bcrypt`.
4. New user is created in MongoDB.
5. JWT token is generated from `user.generateJWT()`.
6. Backend returns `{ user, token }`.
7. Frontend stores token in `localStorage`.
8. Frontend stores user in `UserContext`.
9. User is redirected to home page.

### Login
Flow:
1. Frontend login screen sends `POST /users/login`.
2. Backend finds user by email and explicitly includes password using `.select('+password')`.
3. Entered password is checked using bcrypt compare.
4. JWT token is generated.
5. Frontend stores token in `localStorage`.
6. Frontend stores user in context and redirects to `/`.

### Protected APIs
Flow:
1. Frontend Axios interceptor automatically attaches:
   - `Authorization: Bearer <token>`
2. Backend `authUser` middleware reads token from:
   - cookie, or
   - `Authorization` header
3. JWT is verified using `JWT_SECRET`.
4. Decoded payload is attached to `req.user`.

### Important note
`UserContext` only stores `user` and `setUser`, but `UserAuth.jsx` expects `loading` too. That means the intended auth guard design is slightly inconsistent with the current context implementation.

---

## 5. Database design

The project currently uses **2 MongoDB collections**.

## 5.1 Users collection

Model file:
- `Backend/models/user.model.js`

Schema fields:

### `email`
- Type: `String`
- Required: yes
- Unique: yes
- Trimmed: yes
- Lowercased: yes
- Min length: 6
- Max length: 50

Purpose:
- Identifies the user uniquely.
- Used for login and display.

### `password`
- Type: `String`
- Stored hashed using bcrypt
- `select: false`

Purpose:
- Stores hashed password only.
- Hidden by default from Mongoose queries for security.

### Model methods

#### `hashPassword(password)`
- Static method
- Returns bcrypt hash

#### `isValidPassword(password)`
- Instance method
- Compares plain password with hashed password

#### `generateJWT()`
- Instance method
- Creates JWT token with:
  - `_id`
  - `email`
- Expiry: `7d`

### Example user document
```json
{
  "_id": "661b00000000000000000001",
  "email": "user@example.com",
  "password": "$2b$10$hashedvalue..."
}
```

---

## 5.2 Projects collection

Model file:
- `Backend/models/project.model.js`

Schema fields:

### `name`
- Type: `String`
- Required: yes
- Unique: yes
- Trimmed: yes
- Lowercased: yes

Purpose:
- Human-readable project name.
- Used in home screen project listing.

### `users`
- Type: array of `ObjectId`
- Reference model: `user`

Purpose:
- Stores all collaborators in the project.
- First user is usually the creator.

### `fileTree`
- Type: `Object`
- Default: `{}`

Purpose:
- Stores the generated or edited project files.
- This is the core data used by the editor and preview system.

### Example project document
```json
{
  "_id": "661b00000000000000000099",
  "name": "portfolio-app",
  "users": [
    "661b00000000000000000001",
    "661b00000000000000000002"
  ],
  "fileTree": {
    "index.html": {
      "file": {
        "contents": "<!DOCTYPE html>..."
      }
    },
    "style.css": {
      "file": {
        "contents": "body { margin: 0; }"
      }
    }
  }
}
```

---

## 5.3 What is not stored in DB

Important for studying:
- Chat messages are **not persisted** in MongoDB.
- Only project metadata and file tree are stored.
- Socket messages are real-time only.

So if you refresh or reconnect:
- project data remains
- file tree remains
- chat history does not remain unless it is still in frontend state

---

## 6. How to create the database

This project does not create tables like SQL. Since it uses MongoDB:
- You create a database by connecting to it with a valid MongoDB URI.
- Collections are created automatically when first documents are inserted.

### Required environment variables

Backend needs:
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_AI_KEY`
- `PORT` (optional)

Frontend needs:
- `VITE_API_URL`

### Example backend `.env`
```env
MONGODB_URI=mongodb://127.0.0.1:27017/aichatapp
JWT_SECRET=your_jwt_secret
GOOGLE_AI_KEY=your_google_gemini_api_key
PORT=3000
```

### Example frontend `.env`
```env
VITE_API_URL=http://localhost:3000
```

### If using local MongoDB
1. Install MongoDB locally.
2. Start MongoDB service.
3. Use a URI like:
   `mongodb://127.0.0.1:27017/aichatapp`
4. Start backend.
5. When users/projects are created, MongoDB automatically creates the collections.

### If using MongoDB Atlas
1. Create an Atlas cluster.
2. Create a database user.
3. Whitelist your IP.
4. Copy the connection string.
5. Put it into `MONGODB_URI`.
6. Start backend.

### How collections get created
- When `/users/register` is called for the first time, MongoDB creates the users collection.
- When `/projects/create` is called for the first time, MongoDB creates the projects collection.

---

## 7. Frontend structure and flow

Important files:
- `Frontend/src/main.jsx`
- `Frontend/src/App.jsx`
- `Frontend/src/routes/AppRoutes.jsx`
- `Frontend/src/context/user.context.jsx`
- `Frontend/src/auth/UserAuth.jsx`

### Startup flow
1. `main.jsx` renders `<App />`.
2. `App.jsx` wraps the whole app in `UserProvider`.
3. `AppRoutes.jsx` defines routes:
   - `/`
   - `/login`
   - `/register`
   - `/project`
   - `/preview/:id`
4. Protected pages are wrapped with `UserAuth`.

### User state flow
`UserProvider` exposes:
- `user`
- `setUser`

This is used by:
- login page
- register page
- project page

### Axios connection
File:
- `Frontend/src/config/axios.js`

What it does:
- Reads API base URL from `VITE_API_URL`
- Adds JWT token to every request automatically
- If server returns `401`, token is removed and user is redirected to `/login`

This is the main frontend-backend bridge for REST APIs.

---

## 8. How frontend and backend are connected

There are **2 connections** between frontend and backend.

## 8.1 REST API connection

Used for:
- register
- login
- fetch users
- create project
- fetch all projects
- fetch one project
- update file tree
- add collaborators
- AI generation via HTTP

Frontend tool:
- Axios instance in `Frontend/src/config/axios.js`

Backend handlers:
- Express routes/controllers/services

Example:
1. Frontend calls `axios.post('/projects/create', { name })`
2. Request goes to backend `/projects/create`
3. Controller validates input
4. Service creates MongoDB document
5. Response returns to frontend
6. Frontend updates its local state

## 8.2 Socket.IO connection

Used for:
- real-time project messages
- AI request via chat when user types `@ai ...`

Frontend file:
- `Frontend/src/config/socket.js`

Backend file:
- `Backend/server.js`

Socket connection flow:
1. Frontend calls `initializeSocket(projectId)`.
2. Token is sent in `auth`.
3. `projectId` is sent in socket query.
4. Backend verifies token and validates project ID.
5. Socket joins room = project `_id`.
6. When a user sends `"project-message"`, backend broadcasts it to others in the same room.

### AI through chat
If message contains `@ai`:
1. Backend strips `@ai` from the text.
2. Prompt is sent to `generateProjectFileTree(prompt)`.
3. Backend returns an AI message containing:
   - `type`
   - `plan`
   - `fileTree`
   - text response
4. Frontend receives that message.
5. Frontend mounts file tree into WebContainer and displays generated files.

This is the second major frontend-backend connection.

---

## 9. Feature-by-feature implementation

## 9.1 User registration feature

Frontend:
- `Frontend/src/screens/Register.jsx`

Backend:
- route: `POST /users/register`
- controller: `createUserController`
- service: `createUser`
- model: `user.model.js`

Implementation steps:
1. User enters email and password.
2. Form sends request to backend.
3. Backend validates inputs.
4. Password is hashed.
5. User is stored in MongoDB.
6. JWT token is returned.
7. Token saved in browser.
8. User context updated.
9. App redirects to home.

## 9.2 User login feature

Frontend:
- `Frontend/src/screens/Login.jsx`

Backend:
- route: `POST /users/login`
- controller: `loginController`

Implementation steps:
1. User enters credentials.
2. Frontend sends them to backend.
3. Backend fetches user by email.
4. Password is compared.
5. Token is generated.
6. Frontend stores token and user object.
7. User is redirected to `/`.

## 9.3 Get profile / auth-protected user access

Backend:
- route: `GET /users/profile`
- middleware: `authUser`

Purpose:
- Confirm current logged-in user using JWT.

Study point:
- This app mostly relies on token storage plus local context.
- It does not appear to restore user from `/users/profile` on app boot.

## 9.4 Project creation feature

Frontend:
- `Frontend/src/screens/Home.jsx`

Backend:
- route: `POST /projects/create`
- controller: `createProject`
- service: `createProject`

Implementation steps:
1. User clicks `New Project`.
2. Modal opens.
3. User types project name.
4. Frontend sends authenticated request to backend.
5. Backend validates name.
6. Backend creates project with:
   - `name`
   - `users: [loggedInUserId]`
7. Project is returned and added to frontend project list.

## 9.5 View all projects feature

Frontend:
- `Home.jsx`

Backend:
- route: `GET /projects/all`
- controller: `getAllProjects`
- service: `getAllProjectsByUserId`

Implementation steps:
1. Home page loads.
2. `fetchProjects()` calls backend.
3. Backend finds all projects where logged-in user ID is inside `users` array.
4. Frontend renders project cards.

## 9.6 Open project workspace feature

Frontend:
- `Project.jsx`

Flow:
1. User clicks project card on home page.
2. App navigates to `/project`.
3. Full project object is passed using router `state`.
4. `Project.jsx` extracts `projectId` and project data from location state.
5. Frontend fetches latest project via:
   - `GET /projects/get-project/:projectId`
6. Returned project includes populated users and saved file tree.

Important note:
- Current route is `/project`, not `/project/:id`.
- This means direct refresh or direct URL sharing is weaker because the page depends on `location.state`.

## 9.7 Add collaborators feature

Frontend:
- `Project.jsx`

Backend:
- route: `PUT /projects/addusers`
- controller: `addUserToProject`
- service: `addUserToProject`

Implementation steps:
1. User opens add collaborator modal.
2. Frontend fetches all users from `GET /users/all`.
3. User selects one or more user IDs.
4. Frontend sends:
   - `projectId`
   - `users` array
5. Backend uses MongoDB `$addToSet` with `$each`.
6. Duplicate collaborator IDs are prevented automatically.
7. Updated project is returned.

Study point:
- The service currently has a comment saying it is a temporary simplified version.
- It does not enforce strong permission checks.

## 9.8 Real-time chat feature

Frontend:
- `Project.jsx`
- `Frontend/src/config/socket.js`

Backend:
- `Backend/server.js`

Implementation steps:
1. When project page opens, frontend initializes socket using project ID.
2. Backend authenticates socket connection with JWT.
3. Socket joins project room.
4. User types a message and clicks send.
5. Frontend emits `project-message`.
6. Backend broadcasts that message to other users in the same room.
7. Frontend appends message to message list.

Study point:
- Messages live in React state only.
- They are not saved to MongoDB.

## 9.9 AI code generation feature

This feature is one of the core parts of the app.

Relevant backend files:
- `Backend/server.js`
- `Backend/controllers/ai.controller.js`
- `Backend/services/ai.service.js`
- `Backend/services/generator.service.js`
- `Backend/agents/planner.agent.js`
- `Backend/agents/coder.agent.js`
- `Backend/agents/reviewer.agent.js`
- `Backend/utils/llm.util.js`
- `Backend/utils/prompts.js`
- `Backend/utils/retry.util.js`

### Two AI entry points

#### A. Chat-based AI
Triggered by:
- sending a socket message containing `@ai`

Flow:
1. Backend detects `@ai` in chat text.
2. Prompt is cleaned.
3. `generateProjectFileTree(prompt)` is called.
4. AI pipeline runs:
   - planner agent
   - coder agent
   - reviewer agent
5. Final `fileTree` is normalized.
6. AI response is emitted back to project room.
7. Frontend displays response and mounts files.

#### B. HTTP-based AI
Route:
- `POST /ai/generate-project`

Flow:
1. Frontend or client sends `prompt` and `projectId`.
2. Backend generates file tree.
3. Backend updates project’s `fileTree`.
4. Updated project is returned.

### AI generation pipeline

#### Planner agent
File:
- `Backend/agents/planner.agent.js`

Purpose:
- Takes raw user prompt.
- Returns JSON plan and list of files.

#### Coder agent
File:
- `Backend/agents/coder.agent.js`

Purpose:
- Takes plan.
- Returns JSON `fileTree` with code contents.

#### Reviewer agent
File:
- `Backend/agents/reviewer.agent.js`

Purpose:
- Reviews/fixes generated file tree.
- Returns cleaned JSON output.

#### Generator service
File:
- `Backend/services/generator.service.js`

Purpose:
- Orchestrates all 3 agents.
- Normalizes AI output into the app’s expected `fileTree` format.
- Adds fallback `index.html` if generation fails or is incomplete.

### AI file tree format
Expected format:
```json
{
  "index.html": {
    "file": {
      "contents": "<!DOCTYPE html>...</html>"
    }
  }
}
```

This format is used by:
- MongoDB `projects.fileTree`
- file explorer UI
- editor
- WebContainer mount

## 9.10 File explorer and editor feature

Frontend:
- `Project.jsx`

Implementation steps:
1. Project file tree is loaded from backend.
2. Frontend recursively renders files/folders.
3. Clicking a file opens it in an editor tab.
4. File contents are shown using syntax highlighting.
5. User edits content directly in a `contentEditable` code area.
6. On blur, updated content is written back into local `fileTree`.
7. Frontend calls:
   - `PUT /projects/update-file-tree`
8. Backend stores modified file tree in MongoDB.

## 9.11 Create new file feature

Frontend:
- `Project.jsx`

Implementation steps:
1. User opens create file modal.
2. User enters filename and selects type.
3. Frontend generates starter content based on type:
   - js
   - jsx
   - css
   - html
   - json
4. New file is inserted into `fileTree`.
5. Updated `fileTree` is saved to backend.

## 9.12 Run and preview feature

Frontend:
- `Project.jsx`
- `Preview.jsx`
- `Frontend/src/config/webContainer.js`

How it works:
1. Frontend boots WebContainer in browser.
2. `fileTree` is mounted into WebContainer virtual filesystem.
3. Project type is detected:
   - HTML
   - Node
   - React
4. Based on type:
   - HTML: generate blob URL from `index.html`, `style.css`, `script.js`
   - Node: run `npm install`, then `npm start`
   - React: run `npm install`, then `npm run dev`
5. When server is ready, iframe URL is shown in modal.

This feature is fully frontend-side runtime execution.

---

## 10. File tree concept explained simply

`fileTree` is the heart of the coding workspace.

Think of it as a JSON version of a filesystem.

Example:
```json
{
  "src": {
    "App.jsx": {
      "file": {
        "contents": "export default function App() { return <h1>Hello</h1>; }"
      }
    }
  },
  "package.json": {
    "file": {
      "contents": "{ \"name\": \"demo\" }"
    }
  }
}
```

Why it matters:
- AI generates this structure.
- MongoDB stores it.
- Frontend renders it.
- WebContainer runs it.

So one structure connects:
- AI
- database
- editor
- preview

---

## 11. Service-controller-model pattern used in backend

This backend mostly follows this layered approach:

### Route
Receives URL and maps to controller.

Example:
- `POST /projects/create`

### Controller
Handles request/response and validation.

Example:
- `createProject`

### Service
Contains business logic or DB logic.

Example:
- `projectService.createProject`

### Model
Defines MongoDB schema.

Example:
- `project.model.js`

This separation makes code easier to study and scale.

---

## 12. Important environment and setup steps

## Backend setup
From `Backend/`:
```bash
npm install
```

Start backend:
```bash
node server.js
```

Or if using nodemon:
```bash
npx nodemon server.js
```

## Frontend setup
From `Frontend/`:
```bash
npm install
npm run dev
```

### Ports
Typical development setup:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### CORS
Backend currently allows:
- `https://chattermind-1.onrender.com`
- `http://localhost:5173`

---

## 13. Important code observations and current limitations

These are useful for study because they show the difference between architecture and current implementation state.

### 1. Auth context inconsistency
- `UserAuth.jsx` expects `loading`.
- `user.context.jsx` does not provide `loading`.
- So route protection logic is incomplete or partially migrated.

### 2. Register screen has a typo
- In `Register.jsx`, password input line contains an extra `s` after `onChange`.
- That is likely a JSX bug.

### 3. Project page depends on router state
- Route is `/project`, not `/project/:id`.
- Refreshing or direct linking can break because the page expects `location.state.project`.

### 4. Socket AI DB update has a bug
- In `Backend/server.js`, inside the socket `project-message` handler, database update uses `projectId`.
- That variable is not defined in that handler scope.
- It likely should use `socket.project._id` or `socket.roomId`.

### 5. `saveCode` logic is weak
- Socket `saveCode` updates `findOneAndUpdate({})`.
- That means it does not target a specific project safely.

### 6. Chat is not persisted
- Messages disappear on refresh.

### 7. Add collaborator permissions are simplified
- Current service comment says it is temporary.
- No strong ownership check exists before adding users.

### 8. Preview route and project route are partly overlapping
- `Project.jsx` already includes preview modal.
- `Preview.jsx` adds another preview path approach.
- Both exist, but main workspace already handles preview directly.

---

## 14. If you need to explain this project in an exam or viva

You can describe it like this:

> This is a collaborative AI coding platform built with React on the frontend and Express/Node.js on the backend. MongoDB stores users and projects, while Socket.IO enables real-time collaboration. Each project contains collaborators and a `fileTree` object that acts like a virtual filesystem. Users can chat, invite collaborators, generate code using Gemini AI by typing `@ai`, edit generated files in the browser, save them to MongoDB, and run the project live using WebContainer.

Short module-wise explanation:
- Authentication module: register/login with bcrypt + JWT
- Project module: create project, fetch project, add collaborators
- Realtime module: Socket.IO chat room per project
- AI module: planner -> coder -> reviewer agents generate project files
- Editor module: file tree rendering and editable source code
- Preview module: WebContainer runs HTML, Node, or React projects
- Database module: stores users and projects

---

## 15. Quick revision sheet

### Backend summary
- `app.js` sets middleware and routes
- `server.js` adds Socket.IO
- `db.js` connects MongoDB
- models define schema
- controllers handle requests
- services handle DB/business logic
- middleware verifies JWT

### Frontend summary
- `main.jsx` renders app
- `App.jsx` wraps user context
- `AppRoutes.jsx` defines routes
- `axios.js` connects to backend
- `socket.js` connects realtime chat
- `Home.jsx` handles projects
- `Project.jsx` handles chat, collaborators, files, preview
- `Login.jsx` and `Register.jsx` handle auth

### Database summary
- `users`: email, password
- `projects`: name, users, fileTree

### Most important data structure
- `fileTree`

### Most important technologies
- React
- Express
- MongoDB
- Socket.IO
- JWT
- Gemini AI
- WebContainer

---

## 16. Best way to study this project

Study in this order:

1. Read database models first
   - `user.model.js`
   - `project.model.js`

2. Read backend flow next
   - `app.js`
   - `server.js`
   - routes
   - controllers
   - services

3. Read frontend route structure
   - `App.jsx`
   - `AppRoutes.jsx`
   - `user.context.jsx`

4. Then study screens in this order
   - `Login.jsx`
   - `Register.jsx`
   - `Home.jsx`
   - `Project.jsx`

5. Finally study AI and preview
   - `generator.service.js`
   - `planner/coder/reviewer agents`
   - `webContainer.js`

If you understand:
- JWT auth flow
- project CRUD flow
- socket chat flow
- fileTree storage flow
- AI generation flow

then you understand almost the entire system.

