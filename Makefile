# Thin wrappers around Docker Compose. Run `make help` for the list.
# Everything here also works with plain `docker compose` if make is missing.

COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help up down logs migrate seed test test-unit test-e2e reset

help: ## List the available targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

.env:
	cp .env.example .env

up: .env ## Build and start the stack, wait until it is healthy
	$(COMPOSE) up --build --detach --wait
	@echo "App running at http://$$($(COMPOSE) port web 3000 | sed 's/0.0.0.0/localhost/')"

down: ## Stop the stack (data is kept)
	$(COMPOSE) down

logs: ## Follow logs (all services, or one: make logs s=web)
	$(COMPOSE) logs --follow $(s)

migrate: ## Create and apply a migration after editing prisma/schema.prisma (make migrate name=add_x)
	$(COMPOSE) run --rm migrate npx prisma migrate dev $(if $(name),--name $(name))
	$(COMPOSE) restart web

seed: ## Insert the demo user (demo@example.com / password123)
	$(COMPOSE) run --rm migrate npx prisma db seed

test: test-unit test-e2e ## Run unit tests, then e2e tests against the running stack

test-unit: ## Run Vitest in a container (starts the database if needed)
	$(COMPOSE) run --rm migrate npm run test:unit

E2E_CONTAINER := ticketing-system-e2e-run

test-e2e: ## Run Playwright in a container against the running stack
	@docker rm --force $(E2E_CONTAINER) > /dev/null 2>&1 || true
	@rm -rf playwright-report test-results
	$(COMPOSE) --profile e2e run --build --name $(E2E_CONTAINER) e2e; status=$$?; \
	docker cp $(E2E_CONTAINER):/e2e/playwright-report ./playwright-report > /dev/null 2>&1; \
	docker cp $(E2E_CONTAINER):/e2e/test-results ./test-results > /dev/null 2>&1; \
	docker rm $(E2E_CONTAINER) > /dev/null; \
	echo "Playwright report: npx playwright show-report (or open playwright-report/index.html)"; \
	exit $$status

reset: ## Delete all data and volumes, then start fresh
	$(COMPOSE) --profile e2e down --volumes --remove-orphans
	$(MAKE) up
