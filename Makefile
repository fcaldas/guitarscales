.DEFAULT_GOAL := help

.PHONY: help install run build deploy

help: ## Show available commands.

	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-10s %s\n", $$1, $$2}'

install: ## Install project dependencies.

	pnpm install

run: ## Start the local development server at http://localhost:5173/guitarscales/.

	pnpm dev -- --host 127.0.0.1

build: ## Create a production build in dist/.

	pnpm build

deploy: ## Build and publish the site to GitHub Pages.

	pnpm deploy
