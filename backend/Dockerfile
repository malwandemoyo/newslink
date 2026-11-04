FROM node:23-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY database ./database
COPY backend ./backend
RUN mkdir -p /app/data
EXPOSE 4000
CMD ["node", "backend/server.mjs"]
