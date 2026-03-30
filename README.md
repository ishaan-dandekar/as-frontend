# APSIT Student Sphere Frontend

Frontend application for APSIT Student Sphere, a student collaboration and networking platform where students can build profiles, discover peers, create projects, join teams, register for events, and track notifications.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- React Query
- Axios

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a local env file from the example:

```bash
cp .env.local.example .env.local
```

Default backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_ENABLE_MOCK_API=false
```

### 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - build for production
- `npm run start` - run production build
- `npm run lint` - run ESLint

## Project Structure

- `src/app` - routes and page layouts
- `src/components` - UI and feature components
- `src/api` - API client modules
- `src/hooks` - React hooks for app data/state
- `src/types` - shared TypeScript types

## Notes

- This frontend is designed to work with the APSIT Student Sphere backend.
- Keep sensitive values in `.env.local` only.
