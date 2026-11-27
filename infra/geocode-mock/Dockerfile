FROM node:22-alpine

WORKDIR /app

COPY infra/geocode-mock/server.mjs ./

RUN chown -R node:node /app
USER node

EXPOSE 4200

CMD ["node", "server.mjs"]
