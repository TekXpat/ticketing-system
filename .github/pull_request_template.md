## What does this change?

<!-- One or two sentences. Link the issue if there is one. -->

## Why?

<!-- The problem this solves, or the decision behind it. -->

## How to verify

<!-- Steps a reviewer can follow to see it working. -->

## Checklist

- [ ] Branch is `feature/*` (or `fix/*`) and targets `dev`, not `main`
- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org) (`feat: …`, `fix: …`)
- [ ] CI is green: format, lint, typecheck, unit tests, build, e2e
- [ ] New behaviour has tests (unit, e2e, or both)
- [ ] Schema changes come with a migration in `prisma/migrations/`
- [ ] New environment variables are documented in `.env.example`
- [ ] No secrets, credentials or `.env` files committed
- [ ] I have run the app locally (`make up`) and tried the change myself
