# Stage 1: Build Vite App
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with 'serve' (reads $PORT from env automatically)
FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
# 'serve -s' enables SPA fallback (React Router support)
# ${PORT:-3000} uses Railway's injected PORT, falls back to 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
