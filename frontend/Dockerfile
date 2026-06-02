# Stage 1: Build Node Application
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve Bundle with Nginx
FROM nginx:alpine
# Install envsubst (part of gettext) for runtime PORT substitution
RUN apk add --no-cache gettext
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
# Copy template (uses $PORT placeholder)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
# At startup: substitute $PORT into the config, then launch nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
