# Imagen de la API. Se construye desde la RAÍZ del monorepo (ver docker-compose.yml)
# con el lockfile de pnpm y --frozen-lockfile: es el mismo árbol de dependencias que
# audita el CI, con los overrides de seguridad de pnpm-workspace.yaml aplicados.
FROM node:22-alpine AS base
RUN npm install -g pnpm@10
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

FROM base AS build
RUN pnpm install --frozen-lockfile --filter api
COPY apps/api apps/api
RUN pnpm --filter api build

FROM base AS runtime
# Solo dependencias de producción; el store de pnpm se descarta para achicar la imagen.
RUN pnpm install --frozen-lockfile --prod --filter api && rm -rf "$(pnpm store path)"
COPY --from=build /repo/apps/api/dist apps/api/dist
WORKDIR /repo/apps/api
# El proceso no corre como root.
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
