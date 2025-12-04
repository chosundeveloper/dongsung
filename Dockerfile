# Build stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY backend ./backend
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install build tools for native modules (sqlite3)
RUN apk add --no-cache python3 make g++ linux-headers

COPY package*.json ./
COPY backend ./backend

# Install dependencies including dev dependencies for native module compilation
RUN npm install --legacy-peer-deps

# Remove dev dependencies
RUN npm prune --omit=dev

COPY --from=builder /app/dist ./dist
COPY server.js .

EXPOSE 3000 3001
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Determine which service to run based on PORT environment variable
CMD ["sh", "-c", "if [ \"$PORT\" = \"3001\" ]; then node backend/index.js; else node server.js; fi"]
