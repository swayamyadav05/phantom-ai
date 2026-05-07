<p align="center">
  <img src="public/name-logo.svg" alt="Phantom AI" width="420" />
</p>

# Phantom AI

Phantom AI is a real-time collaborative system design workspace. It is built around a simple flow: sign in, create or open an architecture project, collaborate on the design, and eventually turn the shared graph into a persistent Markdown technical specification.

> [!NOTE]
> This repository is in active development. Authentication, project management, workspace routing, and project sharing are implemented. The real-time canvas, AI generation workflow, starter templates, and spec generation pipeline are planned next steps in the project context.

## Features

- Clerk-powered sign-in, sign-up, and protected editor routes.
- Project creation, rename, delete, ownership, and workspace navigation.
- Owner/collaborator access checks for workspace routes and API mutations.
- Share dialog for inviting collaborators by email, viewing enriched Clerk user details, removing collaborators, and copying the workspace link.
- Dark-only technical workspace UI built with Tailwind v4, shadcn/ui, and Lucide icons.
- Architecture direction for a Liveblocks + React Flow canvas, Trigger.dev background AI tasks, and Vercel Blob artifact storage.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Base UI, Lucide React |
| Auth | Clerk |
| Database | PostgreSQL with Prisma 7 |
| Planned collaboration canvas | Liveblocks, React Flow |
| Planned durable workflows | Trigger.dev |
| Planned artifact storage | Vercel Blob |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL database
- Clerk application keys
- Liveblocks secret key

### Install

```bash
npm install
```

### Configure Environment

Create `.env` at the project root and provide the values used by the app. The Prisma config reads `DATABASE_URL` from this file, and Next.js will also load it during local development.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/editor"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/editor"
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/editor"
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/editor"
LIVEBLOCKS_SECRET_KEY="sk_..."
```

### Prepare the Database

Generate the Prisma client and apply the existing migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

### Run the App

```bash
npm run dev
```

Open the local URL printed by Next.js, then sign in and visit `/editor`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build the production app. |
| `npm run start` | Start the production server after building. |
| `npm run lint` | Run ESLint. |

## Project Structure

```text
context/                 Product, architecture, UI, workflow, and progress specs
prisma/                  Prisma schema, models, and migrations
public/                  Brand assets and favicons
src/app/                 Next.js routes, layouts, pages, and API handlers
src/components/          Editor and UI components
src/context/             React context providers
src/hooks/               Client-side editor/project hooks
src/lib/                 Prisma, project access, and shared utilities
src/types/               Shared TypeScript contracts
```

## Development Notes

- Read the files in `context/` before making product or architecture changes.
- Keep `context/progress-tracker.md` updated when implementation state changes.
- This project uses Next.js 16. Read the relevant docs in `node_modules/next/dist/docs/` before changing framework-specific code.
- Generated shadcn/ui foundation components live in `src/components/ui/` and should stay reusable.
