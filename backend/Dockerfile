FROM node:22

WORKDIR /app

COPY package*.json ./

# See frontend/Dockerfile for why the retry/timeout flags are here.
RUN npm ci --no-audit --no-fund \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --fetch-timeout=600000

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]