FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
# npm 10 bundled with node:22-alpine fails resolving this dependency tree
# ("Cannot read properties of null (reading 'edgesOut')"). npm 11 fixes it.
RUN npm install -g npm@11.19.0 && npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/src ./src

EXPOSE 5173
CMD ["npm", "run", "dev"]
