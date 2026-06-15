# Project Kanban

A minimal YouTrack-like starter with a React/Vite frontend and a NestJS API.

## Stack

- React + Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- shadcn/ui-style local components
- NestJS + Fastify
- PostgreSQL-ready Drizzle setup

## Getting Started

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173

API: http://localhost:3333/api

## Useful Scripts

```bash
npm run dev
npm run build
npm run typecheck
```

## API Routes

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:key/board`
