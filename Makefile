# Skill Swap Platform - Makefile

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
PROJECT_NAME = skill-swap-platform

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help install dev build start stop clean logs test lint

# Default target
help: ## Show this help message
	@echo "$(GREEN)Skill Swap Platform - Available Commands$(NC)"
	@echo "========================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# Development commands
install: ## Install dependencies for both client and server
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm install
	cd server && npm install --legacy-peer-deps
	cd client && npm install --legacy-peer-deps

dev: ## Start development servers (client and server)
	@echo "$(GREEN)Starting development servers...$(NC)"
	npm run dev

dev-docker: ## Start development environment with Docker
	@echo "$(GREEN)Starting development environment with Docker...$(NC)"
	$(DOCKER_COMPOSE_DEV) up --build

# Production commands
build: ## Build production Docker image
	@echo "$(GREEN)Building production Docker image...$(NC)"
	docker build -t $(PROJECT_NAME):latest .

start: ## Start production environment
	@echo "$(GREEN)Starting production environment...$(NC)"
	$(DOCKER_COMPOSE) up -d

stop: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE_DEV) down

restart: ## Restart all services
	@echo "$(YELLOW)Restarting services...$(NC)"
	$(DOCKER_COMPOSE) restart

# Database commands
db-reset: ## Reset database (development only)
	@echo "$(RED)Resetting database...$(NC)"
	rm -f server/data/skillswap.db
	@echo "Database reset complete"

# Utility commands
clean: ## Clean up Docker containers and images
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	$(DOCKER_COMPOSE) down --rmi all --volumes --remove-orphans
	$(DOCKER_COMPOSE_DEV) down --rmi all --volumes --remove-orphans
	docker system prune -af

logs: ## Show logs for all services
	@echo "$(GREEN)Showing logs...$(NC)"
	$(DOCKER_COMPOSE) logs -f

logs-dev: ## Show development logs
	@echo "$(GREEN)Showing development logs...$(NC)"
	$(DOCKER_COMPOSE_DEV) logs -f

# Testing commands
test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	cd server && npm test
	cd client && npm test

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	cd server && npm run test:coverage
	cd client && npm run test:coverage

# Linting commands
lint: ## Run linting
	@echo "$(GREEN)Running linting...$(NC)"
	cd server && npm run lint
	cd client && npm run lint

lint-fix: ## Fix linting issues
	@echo "$(GREEN)Fixing linting issues...$(NC)"
	cd server && npm run lint:fix
	cd client && npm run lint:fix

# Security commands
security-audit: ## Run security audit
	@echo "$(GREEN)Running security audit...$(NC)"
	cd server && npm audit
	cd client && npm audit

security-fix: ## Fix security issues
	@echo "$(GREEN)Fixing security issues...$(NC)"
	cd server && npm audit fix
	cd client && npm audit fix

# Production deployment
deploy: ## Deploy to production
	@echo "$(GREEN)Deploying to production...$(NC)"
	docker build -t $(PROJECT_NAME):latest .
	$(DOCKER_COMPOSE) up -d --build

# Health check
health: ## Check application health
	@echo "$(GREEN)Checking application health...$(NC)"
	curl -f http://localhost:5000/api/health || exit 1

# Database backup
backup: ## Backup database
	@echo "$(GREEN)Creating database backup...$(NC)"
	mkdir -p backups
	cp server/data/skillswap.db backups/skillswap_$(shell date +%Y%m%d_%H%M%S).db
	@echo "Backup created in backups/"

# Show status
status: ## Show service status
	@echo "$(GREEN)Service Status:$(NC)"
	$(DOCKER_COMPOSE) ps