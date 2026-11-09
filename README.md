# Ticketing System

A ticketing platform. Organisers create events, customers pick seats or quantities and
pay with (mocked) mobile money, and gate staff check tickets. The three hard problems of
the brief are solved in the database and proved by tests that create real concurrency.

Built on the TekXpat starter: Next.js 15 (App Router, TypeScript strict, Tailwind),
PostgreSQL 16 through Prisma 7, Vitest, Playwright and GitHub Actions.

## Run it

You need **Docker**. Node.js 22 is only needed for editor tooling.

```sh
make up      # build and start everything; the first run takes a few minutes
make seed    # create the demo accounts
```

Open http://localhost:3000.

| Account               | Password      | Role                                             |
| --------------------- | ------------- | ------------------------------------------------ |
| `demo@example.com`    | `password123` | Organiser: creates events, dashboard, all gates  |
| `staff@example.com`   | `password123` | Gate staff: gates only                           |
| any new sign-up       |               | Customer: browses and buys                       |

To promote an account (there is no admin screen):
`UPDATE users SET role = 'ORGANISER' WHERE email = 'you@example.com';`

## Try the whole journey

1. Sign in as the organiser. **Tickets**, then **Create a ticket**. A bus, flight or theatre
   has assigned seats (add seat groups such as Business and Economy, each with its own
   price). A concert or conference sells quantities per ticket type.
2. Sign up as a customer, pick seats or quantities, enter a name for every ticket, and
   pay. On the order page the mock mobile money provider can report success, failure or
   timeout, or send the success callback five times at once.
3. **Account** shows your tickets as a QR code and a text code, with a PDF download.
4. As the organiser or staff, open **Gate**, choose the category and the event, and scan
   the QR with the camera, upload a picture of it, or paste the code.
5. **Dashboard** (organiser) shows sales, revenue and scans, grouped by category.

## The three hard problems

| Problem                       | How it is solved                                                                                                                                                | Proof (tests)                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Two people take the same seat | Unique rule on (event, seat), insert and catch the error. Standing stock: lock the ticket type rows in a fixed order and count. Holds are limited per customer.  | `hold.test.ts`, `create.test.ts`, `hold-limit.test.ts`      |
| The payment callback arrives twice | A payment leaves PENDING exactly once (conditional update). A ticket exists once per order item. A late payment recounts stock under a lock.                | `settle.test.ts`, `settle-late.test.ts`                     |
| Tickets must be hard to forge | Code is the ticket id plus an HMAC-SHA256 signature over id, type and seat. Type, seat and name shown at the gate come from the database. One conditional update marks it used. The gate checks category and event. | `sign.test.ts`, `verify.test.ts`, `purchase-flow.test.ts`   |

Why each choice, and what is unsure, is in [DECISIONS.md](DECISIONS.md).

## Commands

| Command                 | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `make up`               | Build and start the stack, wait until it is healthy                |
| `make down`             | Stop the stack; data is kept                                       |
| `make logs`             | Follow logs (`make logs s=web` for one service)                    |
| `make migrate name=<x>` | After editing `prisma/schema.prisma`: create and apply a migration |
| `make seed`             | Create the demo accounts and the demo bus layout                   |
| `make test`             | Unit tests, then the browser test against the running stack        |
| `make reset`            | Delete the database and start fresh (this deletes all data)        |

Code changes reload automatically. Checks CI runs, which you can run in the dev container:
`docker compose run --rm migrate npm run format:check` (also `lint`, `typecheck`, `build`).

## Configuration

`.env` is created from [`.env.example`](.env.example) on the first `make up`. Two secrets
have development defaults that must be replaced anywhere else:

- `PAYMENT_CALLBACK_SECRET`: sent by the mock provider in the `x-callback-secret` header.
- `TICKET_SIGNING_SECRET`: signs ticket codes. Anyone who knows it can forge tickets.

## What is not done, and why

- **Mixed events.** One event cannot have both a seat picker and standing tickets (a seated
  circle plus a standing floor). The data model allows it, but checkout would need to combine
  both in one order. Seated and standing events each work.
- **Expired holds, orders and payments are cleaned up when a page loads, not on a schedule.**
  If nobody visits, an abandoned checkout keeps its seats until the next visit. A scheduled
  job would fix it.
- **Refunds are out of scope.** A payment that arrives after its place was resold, or after
  the sweeper timed the order out, takes the customer's money and issues no ticket.
- **The callback uses a shared secret header**, not a signature over the body. It proves the
  caller knows the secret, not that the body is unaltered.
- **Ticket signing uses one shared secret**, with no key rotation. A screenshot of a valid
  ticket works for whoever scans it first. The holder name is shown at the gate but not
  enforced. The gate needs the database, so it cannot work offline.
- **Roles are changed with SQL.** There is no admin screen.
- A paid ticket cannot be cancelled or transferred (out of scope).
- Other browsers see seat changes after a refresh, not live.
- The page-level flows (checkout, gate, dashboard) have no browser tests. The logic under
  them is tested on the real database, including a full purchase from hold to gate scan.
- The downloaded ticket PDF prints Latin letters only. Other characters print as `?`.

## Branch model

`feature/*` (or `fix/*`) to `dev` to `main`, every change through a pull request, Conventional
Commits, no direct pushes. Details in [CONTRIBUTING.md](CONTRIBUTING.md).