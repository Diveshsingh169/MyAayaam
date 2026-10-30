# MyAayaam Frontend

Next.js application for the MyAayaam Inventory Management System.

## Requirements

- Node.js 20.9 or later
- Go API running locally on port 8080
- PostgreSQL available to the Go API

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Confirm `.env.local` contains the server-side Go API URL:

   ```env
   MYAAYAAM_API_URL=http://localhost:8080
   ```

4. Start the Go API using the existing backend instructions.

5. Start Next.js:

   ```powershell
   npm run dev
   ```

Open http://localhost:3000.

## Authentication flow

The browser communicates with Next.js routes under `/api/auth/*`. These routes call the Go API server-side and store access and refresh tokens in HttpOnly cookies.

- `POST /api/auth/login` — signs in and sets session cookies.
- `GET /api/auth/me` — returns the current user and refreshes an expired access token when possible.
- `POST /api/auth/refresh` — rotates the refresh token.
- `POST /api/auth/logout` — revokes the refresh token and clears cookies.

The dashboard is under `/dashboard`. User role information comes from the authenticated Go API response, not browser-provided role data.

## Notes

- Never commit `.env.local` or real secrets.
- `MYAAYAAM_API_URL` is server-only. Do not rename it to a `NEXT_PUBLIC_*` variable.
- The current dashboard is a starter shell. Department and user management screens will be implemented in later steps.
