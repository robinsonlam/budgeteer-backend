
# Dockerfile for NestJS Backend

FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install all dependencies (needed for both dev and prod)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Change ownership of the app directory to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose the application port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Default command (can be overridden in docker-compose)
CMD ["node", "dist/main"]