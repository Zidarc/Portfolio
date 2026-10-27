# --- build the site ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve it (static files + POST /api/contact) ---
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/shared ./src/shared
USER node
EXPOSE 8080
# Node 24 runs TypeScript directly by stripping the types
CMD ["node", "server/index.ts"]
