# Frontend — Event Planning Application

This folder contains the React + TypeScript frontend, built with Vite.

For full setup, engineering decisions, and assumptions, see the **[root README](../README.md)**.

## Quick start

```powershell
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. The backend must be running at `http://localhost:4000`.

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Runs the dev server with hot reload   |
| `npm run build`   | Type-checks and builds for production |
| `npm run preview` | Serves the production build locally   |
| `npm run lint`    | Runs ESLint                           |

## Where things live

```
src/
  pages/      -> one file per screen (events, login, settings, ...)
  api/        -> calls to the backend (shared axios client)
  context/    -> shared app state (e.g. logged-in user)
  components/ -> reusable UI pieces

  hooks/      -> reusable logic
  types/      -> shared TypeScript types
```
