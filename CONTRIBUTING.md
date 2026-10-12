# Contributing

## Branch model

```
feature/*  ──PR──▶  dev  ──PR──▶  main
```

| Branch      | Purpose                                                    | Who merges into it    |
| ----------- | ---------------------------------------------------------- | --------------------- |
| `main`      | Released, always deployable                                | PR from `dev` only    |
| `dev`       | Integration: finished features land here first             | PRs from `feature/*`  |
| `feature/*` | One piece of work, branched from `dev` (`feature/sign-up`) | You, by pushing to it |

Use `fix/*` instead of `feature/*` for bug fixes; the rules are the same.

- **Every change goes through a pull request.** Nobody pushes directly to `dev` or `main`.
- Branch from an up-to-date `dev`:
  ```sh
  git switch dev && git pull
  git switch -c feature/short-description
  ```
- Keep a PR to one concern. Several small PRs review better than one large one.
- Fill in the pull request template, including how a reviewer can verify the change.
- CI must be green before merging. If CI fails, fix it on your branch; do not merge around it.

## Conventional Commits

Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<optional scope>): <summary in the imperative, lower case>
```

| Type       | Use for                                             |
| ---------- | --------------------------------------------------- |
| `feat`     | A new feature                                       |
| `fix`      | A bug fix                                           |
| `refactor` | A code change that neither fixes a bug nor adds one |
| `test`     | Adding or correcting tests                          |
| `docs`     | Documentation only                                  |
| `chore`    | Tooling, dependencies, configuration                |
| `ci`       | GitHub Actions changes                              |

Examples: `feat(auth): add password reset`, `fix: reject empty display names`, `test: cover sign-out redirect`.

## Before you open a PR

CI runs these; running them first saves a round trip.

```sh
make test               # unit tests + e2e against the running stack
npm run format:check    # Prettier (npm run format to fix)
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
```

The `npm run` commands need Node.js 22 on your machine and an `npm ci` first. If you only have Docker,
run them in the dev container instead: `docker compose run --rm migrate npm run lint`.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request into `dev` or `main`, and on every push to them.

| Job      | What it does                                                                          |
| -------- | ------------------------------------------------------------------------------------- |
| `checks` | `npm ci`, Prettier check, ESLint, typecheck, Vitest, `next build`                     |
| `e2e`    | Builds the production images, starts `docker-compose.yml`, runs Playwright against it |

Either job failing fails the PR. On an `e2e` failure, the container logs are printed in the job and the
Playwright report is attached as an artifact.

## Branch protection (repository admins)

> **Plan requirement.** GitHub only enforces branch protection and rulesets on **private** repositories
> for organisations on GitHub **Team** or above. TekXpat is on the Free plan, so for this private
> repository the settings below are unavailable until the organisation upgrades or the repository is
> made public. Until then, the rules above are conventions that nothing enforces.

Apply the same ruleset to `main` and `dev`. These steps use **rulesets**, which GitHub recommends over
the older "branch protection rules"; either gives the same result.

Before you start, let CI run at least once (open any PR) so that the `checks` and `e2e` status checks
exist and can be selected.

1. **Settings → Rules → Rulesets → New ruleset → New branch ruleset.**
2. **Ruleset name:** `protect main and dev`. **Enforcement status:** Active.
3. **Bypass list:** leave empty, so the rules apply to administrators as well.
4. **Target branches → Add target → Include by pattern:** add `main`, then add `dev`.
5. Under **Branch rules**, enable:
   - **Restrict deletions**
   - **Require a pull request before merging**
     - Required approvals: **0**. Raise it to 1 if a reviewer will be available to approve
       every PR; with 1 and no reviewer, nothing can be merged.
     - **Require conversation resolution before merging**
   - **Require status checks to pass**
     - **Require branches to be up to date before merging**
     - **Add checks:** `checks` and `e2e` (source: GitHub Actions)
   - **Block force pushes**
6. **Create.**

With "Require a pull request before merging" active, a direct `git push` to `main` or `dev` is rejected,
which is what enforces "no direct pushes".

If you use the classic **Settings → Branches → Add branch protection rule** page instead, create one rule
per branch (`main` and `dev`) with: _Require a pull request before merging_ (approvals as above),
_Require status checks to pass before merging_ (strict; `checks` and `e2e`), _Require
conversation resolution_, _Do not allow bypassing the above settings_, and leave _Allow force pushes_
and _Allow deletions_ unticked.

To keep the `feature/* → dev → main` direction, only open PRs into `main` from `dev`. GitHub cannot
restrict a PR's source branch; reviewers enforce this one.
