FROM node:23-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public data && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN mkdir -p public data
COPY --from=builder /app/public ./public
COPY --from=builder /app/database ./database
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
