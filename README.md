# DueDeck

Cross-platform assignment tracker built with Next.js, Tamagui, and Expo.

## Tech Stack

- **Monorepo:** Turborepo + Bun
- **Web:** Next.js 16 (App Router, Turbopack)
- **UI:** Tamagui v2 (cross-platform)
- **Auth:** Better Auth (email/password)
- **Database:** PostgreSQL + Prisma v7
- **Linting:** Biome

## Project Structure

```
apps/
  web/              Next.js web app (port 3000)
packages/
  ui/               Shared Tamagui components (@repo/ui)
  auth/             Better Auth server + client config (@repo/auth)
  db/               Prisma schema + client (@repo/db)
  typescript-config/ Shared tsconfig
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [Docker](https://www.docker.com/) (for local PostgreSQL)

### Setup

```bash
# 1. Clone and install
bun install

# 2. Create your .env from the template
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 3. Start PostgreSQL (runs on port 5433)
docker compose up -d

# 4. Generate Prisma client
bun run db:generate

# 5. Push schema to database
bun run db:push

# 6. Start dev server
bun run dev
```

Visit http://localhost:3000 — you'll be redirected to `/auth` to sign in or create an account.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps in dev mode |
| `bun run build` | Build all apps and packages |
| `bun run check-types` | TypeScript type checking |
| `bun run lint` | Run Biome linting |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run db:generate` | Generate Prisma client from schema |
| `bun run db:push` | Push Prisma schema to database (no migration) |
| `bun run db:studio` | Open Prisma Studio GUI |

## Database

PostgreSQL via Docker Compose on **port 5433** (5432 may conflict with other local databases).

### After changing the Prisma schema

```bash
bun run db:generate   # Regenerate the Prisma client
bun run db:push       # Push changes to the database
```

### After changing Better Auth config (adding plugins, etc.)

```bash
# Regenerate auth tables in the Prisma schema
bunx @better-auth/cli generate --output ./packages/db/prisma/schema.prisma --config ./packages/auth/src/server.ts --yes

# Then regenerate + push
bun run db:generate
bun run db:push
```

### Migrations (when ready for production)

```bash
cd packages/db
bunx --bun prisma migrate dev --name <migration_name>   # Create migration
bunx --bun prisma migrate deploy                         # Apply in production
```

## Auth

- **Server config:** `packages/auth/src/server.ts`
- **Client config:** `packages/auth/src/client.ts`
- **API route:** `apps/web/app/api/auth/[...all]/route.ts`
- **Auth UI:** `apps/web/app/(auth)/auth/page.tsx`

Email verification is currently **disabled**. To enable it, set `requireEmailVerification: true` in the server config and add an email provider.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://duedeck:duedeck@localhost:5433/duedeck` |
| `BETTER_AUTH_SECRET` | Auth encryption secret (32+ chars) | Generated in `.env` |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | `http://localhost:3000` |

The root `.env` is symlinked into `apps/web/.env` so Next.js picks it up automatically.
