# NestJS + PostgreSQL Starter

Basic full-stack starter for learning:

- Backend: NestJS API with PostgreSQL
- Frontend: Angular app
- Auth: register, login, Google continue, logout, forgot password, reset password, change password, refresh token
- Users: `GET /users`, `POST /users`
- Posts: authenticated Google Keep-style blog notes

## Requirements

- Node.js 20+
- npm
- Docker, or a local PostgreSQL database

## Start PostgreSQL

```bash
docker compose up -d
```

This creates a database at:

```text
postgres://postgres:postgres@localhost:5433/nestjs_starter
```

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend URL:

```text
http://localhost:3000
```

The backend creates the required tables automatically when it starts.

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:4200
```

## API Routes

### Users

```http
GET /users
POST /users
```

Example `POST /users` body:

```json
{
  "name": "Demo User",
  "email": "demo@example.com",
  "password": "password123"
}
```

### Auth

```http
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/change-password
POST /auth/refresh
```

`forgot-password` creates a reset link and sends it by email when `RESEND_API_KEY`
is configured. Without email credentials, the backend logs the reset link in the
local console for development.

`reset-password` uses a reset token plus `password` and `confirmPassword`.
`change-password` requires a bearer access token and accepts `currentPassword`, `newPassword`, and `confirmPassword`.

Password reset email config:

```text
FRONTEND_URL=http://localhost:4201
RESEND_API_KEY=
EMAIL_FROM=KeepBlog <onboarding@resend.dev>
```

To enable Google continue, create a Google OAuth web client, then set the same client ID in:

```text
backend/.env -> GOOGLE_CLIENT_ID
frontend/src/environments/environment.ts -> googleClientId
```

### Posts

These routes require an access token from login/register:

```http
GET /posts
POST /posts
PATCH /posts/:id
DELETE /posts/:id
```

Example `POST /posts` body:

```json
{
  "title": "My first note",
  "content": "A blog draft written like a Google Keep note.",
  "tag": "Ideas",
  "color": "#fff8c5",
  "isPinned": true
}
```

## Project Structure

```text
backend/
  src/
    auth/
    database/
    users/
frontend/
  src/
    app/
    environments/
```
