# Ticketing System — starter repository

This is the starting point for the TekXpat technical assessment. The setup work is already done: Docker,
a Next.js 15 app with a PostgreSQL database, working email-and-password sign-in, tests and CI. You build
the product on top of it.

**Assignment brief:** TODO — link to the brief goes here.

## What's included

- **Next.js 15** (App Router, TypeScript strict mode, Tailwind CSS)
- **PostgreSQL 16** through **Prisma 7**. The schema has only `User` and `Session`.
- **Authentication:** sign up, sign in, sign out, database sessions, and a protected page at `/account`
- **Examples** showing the patterns we expect:
  - API route: [`src/app/api/me/route.ts`](src/app/api/me/route.ts)
  - Server component: [`src/app/(protected)/account/page.tsx`](<src/app/(protected)/account/page.tsx>)
  - Client component: [`src/components/profile-form.tsx`](src/components/profile-form.tsx)
- **Tests:** Vitest (unit) and Playwright (end-to-end)
- **CI:** GitHub Actions runs lint, typecheck, unit tests, build and e2e on every pull request

## Running it

You need **Docker** (Docker Desktop, or Docker Engine with the Compose plugin). Nothing else.

```sh
make up          # build and start everything; first run takes a few minutes
```

Open http://localhost:3000. Without `make`, run `docker compose up --build --wait` instead.

| Command                 | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `make up`               | Build and start the stack, wait until it is healthy                |
| `make down`             | Stop the stack; data is kept                                       |
| `make logs`             | Follow logs (`make logs s=web` for one service)                    |
| `make migrate name=<x>` | After editing `prisma/schema.prisma`: create and apply a migration |
| `make seed`             | Create a demo user: `demo@example.com` / `password123`             |
| `make test`             | Unit tests, then e2e tests against the running stack               |
| `make reset`            | Delete the database and start fresh                                |

Code changes reload automatically: your working directory is mounted into the container.

Configuration lives in `.env` (created from [`.env.example`](.env.example) on first `make up`). Each
variable there is documented and marked build-time or runtime.

### Running Node on your machine instead (optional)

With Node.js 22 installed: `npm ci`, then `npm run dev`, `npm run lint`, `npm run typecheck`,
`npm run test:unit`. `npm test` runs unit and e2e tests; the e2e part expects the stack to be running
at http://localhost:3000 and needs `npx playwright install chromium` once.

## Branch model

`feature/*` → `dev` → `main`, every change through a pull request, Conventional Commits, no direct
pushes. Details in [CONTRIBUTING.md](CONTRIBUTING.md).
