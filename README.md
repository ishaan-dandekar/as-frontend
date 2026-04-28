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

### Test From Another PC On The Same Network

1. Find this machine's LAN IP, for example `192.168.1.10`.
2. Set `NEXT_PUBLIC_API_URL` in `.env.local` to that IP:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.10:8000/api
NEXT_PUBLIC_ENABLE_MOCK_API=false
```

3. Start the frontend so it listens on all interfaces:

```bash
npm run dev:lan
```

4. Start the backend from `as-backend`:

```bash
python manage.py runserver 0.0.0.0:8000
```

5. Open the site from the other PC:

```text
http://192.168.1.10:3000
```

Notes:

- Both devices must be on the same network.
- Allow ports `3000` and `8000` through your firewall if needed.
- For OAuth flows like Google/GitHub, callback URLs may still need to be updated if you want full cross-device auth testing.

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
