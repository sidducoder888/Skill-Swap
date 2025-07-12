# Skill Swap Platform - Competition Ready Makefile

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
DOCKER_COMPOSE_COMP = docker-compose -f docker-compose.competition.yml
PROJECT_NAME = skill-swap-platform

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
BLUE = \033[0;34m
NC = \033[0m # No Color

.PHONY: help install dev build start stop clean logs test lint competition

# Default target
help: ## Show this help message
	@echo "$(GREEN)🏆 Skill Swap Platform - Competition Ready Commands$(NC)"
	@echo "=============================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# Competition commands
competition: ## 🏆 Start competition-ready environment with Redis
	@echo "$(GREEN)🏆 Starting competition environment...$(NC)"
	$(DOCKER_COMPOSE_COMP) up --build -d

competition-dev: ## 🚀 Start competition development environment
	@echo "$(GREEN)🚀 Starting competition development environment...$(NC)"
	$(DOCKER_COMPOSE_COMP) --profile development up --build

competition-stop: ## ⛔ Stop competition environment
	@echo "$(YELLOW)⛔ Stopping competition environment...$(NC)"
	$(DOCKER_COMPOSE_COMP) down

competition-logs: ## 📋 Show competition environment logs
	@echo "$(GREEN)📋 Competition environment logs:$(NC)"
	$(DOCKER_COMPOSE_COMP) logs -f

# Development commands
install: ## 📦 Install dependencies for both client and server
	@echo "$(GREEN)📦 Installing dependencies...$(NC)"
	npm install
	cd server && npm install --legacy-peer-deps
	cd client && npm install --legacy-peer-deps

dev: ## 🚀 Start development servers (client and server)
	@echo "$(GREEN)🚀 Starting development servers...$(NC)"
	npm run dev

dev-docker: ## 🐳 Start development environment with Docker
	@echo "$(GREEN)🐳 Starting development environment with Docker...$(NC)"
	$(DOCKER_COMPOSE_DEV) up --build

# Production commands
build: ## 🏗️ Build production Docker image
	@echo "$(GREEN)🏗️ Building production Docker image...$(NC)"
	docker build -t $(PROJECT_NAME):latest .

start: ## ▶️ Start production environment
	@echo "$(GREEN)▶️ Starting production environment...$(NC)"
	$(DOCKER_COMPOSE) up -d

stop: ## ⏹️ Stop all services
	@echo "$(YELLOW)⏹️ Stopping all services...$(NC)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE_DEV) down
	$(DOCKER_COMPOSE_COMP) down

restart: ## 🔄 Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	$(DOCKER_COMPOSE) restart

# Database commands
db-reset: ## 🗑️ Reset database (development only)
	@echo "$(RED)🗑️ Resetting database...$(NC)"
	rm -f server/data/skillswap.db
	@echo "Database reset complete"

db-backup: ## 💾 Backup database
	@echo "$(GREEN)💾 Creating database backup...$(NC)"
	mkdir -p backups
	cp server/data/skillswap.db backups/skillswap_$(shell date +%Y%m%d_%H%M%S).db
	@echo "Backup created in backups/"

# Utility commands
clean: ## 🧹 Clean up Docker containers and images
	@echo "$(YELLOW)🧹 Cleaning up Docker resources...$(NC)"
	$(DOCKER_COMPOSE) down --rmi all --volumes --remove-orphans
	$(DOCKER_COMPOSE_DEV) down --rmi all --volumes --remove-orphans
	$(DOCKER_COMPOSE_COMP) down --rmi all --volumes --remove-orphans
	docker system prune -af

logs: ## 📋 Show logs for all services
	@echo "$(GREEN)📋 Showing logs...$(NC)"
	$(DOCKER_COMPOSE) logs -f

logs-dev: ## 📋 Show development logs
	@echo "$(GREEN)📋 Showing development logs...$(NC)"
	$(DOCKER_COMPOSE_DEV) logs -f

# Testing commands
test: ## 🧪 Run tests
	@echo "$(GREEN)🧪 Running tests...$(NC)"
	cd server && npm test
	cd client && npm test

test-coverage: ## 📊 Run tests with coverage
	@echo "$(GREEN)📊 Running tests with coverage...$(NC)"
	cd server && npm run test:coverage
	cd client && npm run test:coverage

# Linting commands
lint: ## 🔍 Run linting
	@echo "$(GREEN)🔍 Running linting...$(NC)"
	cd server && npm run lint
	cd client && npm run lint

lint-fix: ## 🔧 Fix linting issues
	@echo "$(GREEN)🔧 Fixing linting issues...$(NC)"
	cd server && npm run lint:fix
	cd client && npm run lint:fix

# Security commands
security-audit: ## 🔐 Run security audit
	@echo "$(GREEN)🔐 Running security audit...$(NC)"
	cd server && npm audit
	cd client && npm audit

security-fix: ## 🛡️ Fix security issues
	@echo "$(GREEN)🛡️ Fixing security issues...$(NC)"
	cd server && npm audit fix
	cd client && npm audit fix

# Competition verification
verify: ## ✅ Verify competition readiness
	@echo "$(GREEN)✅ Verifying competition readiness...$(NC)"
	@echo "$(BLUE)Checking database schema...$(NC)"
	@test -f server/src/database/schema.ts && echo "✅ Advanced schema: OK" || echo "❌ Schema missing"
	@echo "$(BLUE)Checking WebSocket service...$(NC)"
	@test -f server/src/services/websocket.ts && echo "✅ WebSocket: OK" || echo "❌ WebSocket missing"
	@echo "$(BLUE)Checking Redis service...$(NC)"
	@test -f server/src/services/redis.ts && echo "✅ Redis: OK" || echo "❌ Redis missing"
	@echo "$(BLUE)Checking validation...$(NC)"
	@grep -q "express-validator" server/package.json && echo "✅ Validation: OK" || echo "❌ Validation missing"
	@echo "$(BLUE)Checking TypeScript...$(NC)"
	@test -f server/tsconfig.json && test -f client/tsconfig.json && echo "✅ TypeScript: OK" || echo "❌ TypeScript missing"
	@echo "$(GREEN)🏆 Competition verification complete!$(NC)"

# Performance testing
perf-test: ## ⚡ Run performance tests
	@echo "$(GREEN)⚡ Running performance tests...$(NC)"
	@echo "Testing API response times..."
	curl -w "@-" -o /dev/null -s "http://localhost:5000/api/health" <<< "     time_namelookup:  %{time_namelookup}\n        time_connect:  %{time_connect}\n     time_appconnect:  %{time_appconnect}\n    time_pretransfer:  %{time_pretransfer}\n       time_redirect:  %{time_redirect}\n  time_starttransfer:  %{time_starttransfer}\n                     ----------\n          time_total:  %{time_total}\n"

# Health check
health: ## 🏥 Check application health
	@echo "$(GREEN)🏥 Checking application health...$(NC)"
	curl -f http://localhost:5000/api/health || exit 1

# Show status
status: ## 📊 Show service status
	@echo "$(GREEN)📊 Service Status:$(NC)"
	$(DOCKER_COMPOSE) ps
	$(DOCKER_COMPOSE_COMP) ps

# Redis operations
redis-cli: ## 🔧 Connect to Redis CLI
	@echo "$(GREEN)🔧 Connecting to Redis CLI...$(NC)"
	docker exec -it $$(docker ps --filter "name=redis" --format "{{.Names}}" | head -n1) redis-cli

redis-stats: ## 📈 Show Redis statistics
	@echo "$(GREEN)📈 Redis Statistics:$(NC)"
	docker exec $$(docker ps --filter "name=redis" --format "{{.Names}}" | head -n1) redis-cli info stats

# Quick setup for judges
judge-setup: ## 👨‍⚖️ Quick setup for competition judges
	@echo "$(GREEN)👨‍⚖️ Setting up for competition judges...$(NC)"
	@echo "$(BLUE)Step 1: Installing dependencies...$(NC)"
	make install
	@echo "$(BLUE)Step 2: Starting competition environment...$(NC)"
	make competition
	@echo "$(BLUE)Step 3: Waiting for services to be ready...$(NC)"
	sleep 30
	@echo "$(BLUE)Step 4: Verifying health...$(NC)"
	make health
	@echo "$(GREEN)🏆 Platform ready for evaluation!$(NC)"
	@echo "$(YELLOW)Access the application at: http://localhost:5000$(NC)"
	@echo "$(YELLOW)Admin login: admin@skillswap.com / admin123$(NC)"

# Full demo setup
demo: ## 🎬 Setup full demo with sample data
	@echo "$(GREEN)🎬 Setting up demo environment...$(NC)"
	make competition
	sleep 20
	@echo "$(GREEN)✅ Demo ready! Visit http://localhost:5000$(NC)"