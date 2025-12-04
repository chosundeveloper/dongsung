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

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY backend ./backend
COPY server.js .

EXPOSE 3000 3001
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Determine which service to run based on PORT environment variable
CMD ["sh", "-c", "if [ \"$PORT\" = \"3001\" ]; then node backend/index.js; else node server.js; fi"]
