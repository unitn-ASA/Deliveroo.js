# Multi-stage build for better caching and faster rebuilds
FROM node:22.16.0-slim AS base
LABEL author="Marco Robol <marco.robol@unitn.it>"

# Install system dependencies (cached layer)
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    git \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# STAGE 1: Dependencies (cached unless package.json changes)
# Copy package.json files first for better caching
COPY package.json package-lock.json ./
COPY packages packages/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install all dependencies
RUN npm ci --prefer-offline --silent

# STAGE 2: Application code (rebuilds on code changes)
# Copy application source code
COPY backend/ backend/
COPY frontend/ frontend/

# Build application and cleanup dev dependencies to reduce image size
RUN \
    npm run build && \
    rm -rf /app/frontend/node_modules && \
    npm prune --production && \
    cd backend && npm prune --production && cd ..

# Expose port
EXPOSE $PORT

# Start server
CMD ["npm", "start"]
