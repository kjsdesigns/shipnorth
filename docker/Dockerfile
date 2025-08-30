# Multi-stage build for optimal caching and smaller final image
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

WORKDIR /app

# =====================================
# Stage 1: Playwright Browser Cache
# This stage rarely changes, so browsers stay cached
# =====================================
FROM base AS playwright-cache

# Install Playwright first (this layer will be cached)
RUN npm init -y && npm install @playwright/test@^1.54.2

# Install browsers to cache them in Docker layer
RUN npx playwright install chromium webkit firefox

# =====================================
# Stage 2: Dependencies
# =====================================
FROM base AS dependencies

# Copy package files for dependency installation
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install API dependencies
WORKDIR /app/apps/api
RUN npm ci && npm cache clean --force

# Install Web dependencies  
WORKDIR /app/apps/web
RUN npm ci && npm cache clean --force

# Install root dependencies (including Playwright package but not browsers)
WORKDIR /app
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci && npm cache clean --force

# =====================================
# Stage 3: Final Development Image
# =====================================
FROM base AS development

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=dependencies /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=dependencies /app/apps/web/node_modules /app/apps/web/node_modules

# Copy Playwright browsers from cache stage
COPY --from=playwright-cache /root/.cache/ms-playwright /root/.cache/ms-playwright

# Copy application source
COPY . .

# Make scripts executable
RUN chmod +x scripts/*.sh

# Expose ports dynamically
EXPOSE 8849 8850

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8849 && curl -f http://localhost:8850/health || exit 1

# Use optimized startup script
CMD ["./scripts/docker-startup.sh"]