# Multi-stage Dockerfile for Skill Swap Platform
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY client/ ./
RUN npm run build

# Stage 2: Build the backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY server/ ./
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S skillswap -u 1001

# Set working directory
WORKDIR /app

# Copy built backend
COPY --from=backend-builder --chown=skillswap:nodejs /app/server/dist ./dist
COPY --from=backend-builder --chown=skillswap:nodejs /app/server/node_modules ./node_modules
COPY --from=backend-builder --chown=skillswap:nodejs /app/server/package*.json ./

# Copy built frontend
COPY --from=frontend-builder --chown=skillswap:nodejs /app/client/build ./public

# Create necessary directories
RUN mkdir -p data uploads logs && chown -R skillswap:nodejs data uploads logs

# Switch to non-root user
USER skillswap

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]