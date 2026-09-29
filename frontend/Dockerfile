# Stage 1: Build React application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Retry aggressively: a fresh clone on a slow or flaky connection can
# otherwise fail mid-download with ETIMEDOUT and take the whole build down.
# --no-audit/--no-fund skip npm's extra network round-trips, which are a
# common source of those timeouts and add nothing to a reproducible build.
RUN npm ci --no-audit --no-fund \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --fetch-timeout=600000

COPY . .

RUN npm run build


# Stage 2: Serve React application with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.config /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]