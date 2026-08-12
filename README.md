## ZimHub

ZimHub is a full-stack student community platform with a React/Vite frontend and an Express/Node.js backend. It supports authenticated student and admin users, social feed posts, media uploads, notices, notifications, search, support tickets, announcements, and admin moderation.

---

## Key Features

- Full authentication flow
  - register
  - login
  - refresh tokens
  - logout
  - change password
  - password reset via security question
  - account deletion
- Social feed
  - image, video, text, link, and poll posts
  - likes
  - comments
  - post moderation
  - live new-post checks
- Notices board
  - create and browse notices
  - contact details for lost/found, businesses, opportunities
- Search
  - search across posts and notices
- Notifications
  - unread count
  - polling
  - read/unread management
- Admin panel
  - dashboard
  - user management
  - post moderation
  - notice moderation
  - announcements creation/broadcast
  - support ticket handling
  - cache and cleanup controls
  - audit log
- Support system
  - create support queries
  - admin replies
  - anonymous suggestions

---

## Architecture

- client
  - React + Vite frontend
  - Tailwind CSS
  - React Router
  - Zustand state management
  - Axios API client with refresh token handling
- server
  - Express API server
  - PostgreSQL database
  - Redis caching (optional)
  - File upload support with local storage or Cloudflare R2
  - JWT authentication
  - Rate limiting, validation, and security middleware
  - Health check and graceful shutdown
  - Cluster mode for production

---

## Project Structure

- client
  - `src/`
    - `api/` — Axios setup and endpoint clients
    - `components/` — UI, posts, notifications, admin, auth
    - `hooks/` — data loading, theme, notifications, posts
    - `pages/` — login, feed, search, profile, settings, admin, support
    - `store/` — Zustand stores
- server
  - `src/`
    - `config/` — database, Redis, migrations, seed, schema
    - `middleware/` — auth, validation, uploads, rate limiting, errors
    - `modules/` — auth, users, posts, likes, comments, notices, search, admin, announcements, notifications, support
    - `utils/` — storage, cache, helpers, audit logs, cleanup
  - `uploads/` — local media assets for images, videos, avatars, notices

---

## Setup

### 1. Backend

```bash
cd server
npm install
```

Create a `.env` file in server with values like:

```env
DATABASE_URL=postgres://user:password@localhost:5432/zimhub
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
NGROK_URL=http://xxxx.ngrok.io
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=zimhub:
LOCAL_UPLOAD_PATH=./uploads
POST_RETENTION_DAYS=7
```

Optional Cloudflare R2 support:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://<bucket>.<account>.r2.cloudflarestorage.com
```

Run database setup:

```bash
npm run migrate
npm run seed
```

Or combine migration and seed:

```bash
npm run migrate:fresh
```

Start server in development:

```bash
npm run dev
```

For production with clustering:

```bash
npm run start:prod
```

---

### 2. Frontend

```bash
cd client
npm install
```

Create a `client/.env` or set Vite env variable:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## Available Scripts

### Server

- `npm run dev` — start backend with nodemon
- `npm run start` — start backend normally
- `npm run start:prod` — production server with clustering
- `npm run migrate` — apply DB schema
- `npm run seed` — seed users and sample data
- `npm run migrate:fresh` — migrate + seed
- `npm run db:reset` — reset database
- `npm run seed:posts` — seed sample posts
- `npm run seed:notices` — seed sample notices
- `npm test` — run tests
- `npm run test:quick` — quick test run

### Client

- `npm run dev` — start Vite dev server
- `npm run build` — build production assets
- `npm run preview` — preview production build

---

## Sample Seed Accounts

The seed script creates sample users:

- Admin: `admin@zimhub.ac.zw` / `Admin@1234`
- Student: `tendai@uni.ac.zw` / `Student@1234`
- Student: `chidi@uni.ac.zw` / `Student@1234`
- Student: `rudo@uni.ac.zw` / `Student@1234`

---

## Notes

- The server exposes API endpoints under `/api/v1/...`
- CORS is configured for local development and optional ngrok URLs
- Uploads serve from `/uploads` when local storage is used
- Cloudflare R2 is enabled automatically if R2 env vars are present
- The backend supports graceful shutdown and production-ready keep-alive tuning

---
