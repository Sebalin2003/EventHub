# Imagen de la web. Se construye desde la RAÍZ del monorepo (ver docker-compose.yml)
# con el lockfile de pnpm y se sirve compilada con nginx (no el servidor de desarrollo de Vite).
FROM node:22-alpine AS build
RUN npm install -g pnpm@10
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @evenhub/web
COPY apps/web apps/web
RUN pnpm --filter @evenhub/web build

# nginx sin privilegios: sirve el build, agrega las cabeceras de seguridad
# y reenvía /api/* a la API (mismo origen para el navegador).
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 5173
