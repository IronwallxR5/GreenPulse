# GreenPulse Frontend

React + TypeScript + Vite frontend for GreenPulse.

## Overview

The frontend provides:

- Authentication screens (email/password and Google OAuth entry)
- Protected application shell with dashboard navigation
- Project management UI
- Impact log management with filters/sort/pagination
- Analytics charts by project and impact type
- Budget and threshold alert experience
- Live threshold alert updates via WebSocket (SSE fallback supported)
- Project-level audit trail panel for change history
- Recurring compliance report schedule controls and snapshot history
- Profile view and session controls

## Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Recharts
- Axios

## Local Development

```bash
cd frontend
npm install
```

Create `frontend/.env` (or update it):

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Start dev server:

```bash
npm run dev
```

Default URL: `http://localhost:5173`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Type-check and create production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Routing

Public routes:

- `/login`
- `/register`
- `/auth/callback`

Protected routes (inside layout):

- `/dashboard`
- `/projects/:id`
- `/analytics`
- `/profile`

`App.tsx` lazy-loads major route components and wraps them with a suspense fallback loader.

## API Integration

- Axios base URL comes from `VITE_API_BASE_URL`.
- Request interceptor attaches `Authorization: Bearer <token>` when available.
- Auth token and basic user object are stored in local storage via `AuthContext`.
- Project view subscribes to Socket.IO `threshold-alert` events per project.
- `GET /api/projects/:id/alerts/stream` remains available as SSE compatibility fallback.

## Frontend Structure

```text
frontend/
  src/
    App.tsx
    main.tsx
    index.css
    context/
      AuthContext.tsx
    components/
      layout/
        Layout.tsx
      ui/
        ...
    pages/
      Auth/
        Login.tsx
        Register.tsx
        GoogleCallback.tsx
      Dashboard/
      ProjectView/
      Analytics/
      Profile/
    services/
      api.ts
      auth.service.ts
      project.service.ts
      impact.service.ts
    hooks/
      useDebounce.ts
```

## Build and Deployment Notes

- `vite.config.ts` uses manual chunk groups for better bundle splitting.
- The app uses `BrowserRouter`, so static hosting must rewrite unknown routes to `index.html`.
- `vercel.json` is configured with SPA rewrite fallback for this behavior.
