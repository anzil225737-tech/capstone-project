# Daymark Task Manager

A responsive personal task manager built with MongoDB, Express, React, and Node.js. Sign in to organize private tasks by due date, priority, and status.

**Repository:** [github.com/anzil225737-tech/capstone-project](https://github.com/anzil225737-tech/capstone-project)

**Hosted application:** Pending deployment.
**Requirements specification:** [docs/Software Requirements Specification](docs/Software_Requirements_Specification.docx)

## Features

- Register and sign in with email and password.
- Create, edit, complete, reopen, and delete personal tasks.
- Set optional descriptions and due dates, and choose Low, Medium, or High priority.
- Search tasks and filter by To Do, In Progress, or Complete.
- Responsive layout with loading, empty, error, and success feedback.
- Per-user data ownership enforced by the API.

## Technology

| Layer | Tools |
| --- | --- |
| Client | React, Vite, Lucide icons |
| API | Node.js, Express, JWT, bcryptjs |
| Data | MongoDB, Mongoose |
| Security | Helmet, CORS allowlist, input validation, rate limiting on authentication |

## Run locally

Requirements: Node.js 20 or newer and a MongoDB instance.

1. Clone this repository and install the root and app dependencies:

   ```bash
   git clone https://github.com/anzil225737-tech/capstone-project.git
   cd capstone-project
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. Create `server/.env` from `server/.env.example` and set `MONGODB_URI`, a long random `JWT_SECRET`, `PORT=5000`, and `CLIENT_URL=http://localhost:5173`.

3. Create `client/.env` from `client/.env.example`. The local API URL is already the default; set `VITE_API_URL` only if your API uses another address.

4. Start the API and client:

   ```bash
   npm run dev
   ```

   Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The API health check is at `http://localhost:5000/api/v1/health`.

## Environment variables

| Variable | App | Purpose |
| --- | --- | --- |
| `PORT` | server | API listen port; defaults to 5000 |
| `MONGODB_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Secret used to sign access tokens; use a long random value |
| `CLIENT_URL` | server | Allowed browser origin for CORS |
| `VITE_API_URL` | client | API base URL; exposed in the built client, so it must never contain a secret |

Never commit `.env` files or real credentials. Production values belong in the hosting provider's environment settings. The checked-in `.env.example` files contain names and safe local defaults only.

## API overview

All routes use `/api/v1`. Authenticated routes expect `Authorization: Bearer <token>`.

| Method | Path | Use |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Sign in |
| `GET` | `/auth/me` | Read the current account |
| `GET` | `/tasks` | List own tasks; supports `page`, `limit`, `status`, `priority`, `search` |
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks/:id` | Read an owned task |
| `PATCH` | `/tasks/:id` | Update an owned task |
| `DELETE` | `/tasks/:id` | Delete an owned task |
| `GET` | `/health` | Check API availability |

List pagination defaults to 20 records and allows a maximum page size of 100. Error responses use a safe `{ "error": { "code", "message" } }` shape. The API returns 404 for tasks that do not exist or do not belong to the signed-in user.

## Deployment

The repository is public and can be imported into a hosting service. Deploy the API and React client as separate services, and provision a managed MongoDB database.

1. Set the API start command to `npm start` from `server/` (or the repository root command `npm start`), and configure `MONGODB_URI`, `JWT_SECRET`, `PORT`, and the deployed client's exact origin in `CLIENT_URL`.
2. Build the client with `npm run build` in `client/`; publish the generated `client/dist` directory as a static site.
3. Set `VITE_API_URL` to the deployed API's `/api/v1` URL before building the client.
4. Enable HTTPS and configure the static host's SPA fallback so deep links serve `index.html`.
5. Open the live site and verify registration, sign-in, task creation/edit/completion/deletion, cross-user access protection, mobile layout, and page refresh. Then add the hosted URL above and to the SRS.

The hosted URL is not available yet because the app has not been connected to a deployment service or production database. The deployment check has not been completed.

## Verification checklist

- [ ] Install client and server dependencies.
- [ ] Build the production client.
- [ ] Verify registration, login, validation, task CRUD, filters, and pagination.
- [ ] Verify one account cannot read or change another account's tasks.
- [ ] Review keyboard navigation and mobile layout.
- [ ] Verify the live URL uses HTTPS and contains no localhost API requests.
- [ ] Add live application and API URLs after deployment.

## Known limitations and next steps

- Password reset and email verification are not included in the MVP.
- The access token is stored in browser local storage for this student project; a hardened session or secure cookie design can be considered for a production service.
- Tasks are private to one account; sharing, recurring tasks, reminders, and attachments are out of scope.
- Add automated tests and continuous integration before expanding the feature set.

## Project structure

```text
client/                 React and Vite user interface
  src/App.jsx           Authentication and task management UI
  src/style.css         Responsive application styles
server/                 Express API
  src/models/           Mongoose user and task schemas
  src/routes/           Authentication and task routes
  src/middleware/       Authentication and safe error handling
docs/                   Project specification
```
