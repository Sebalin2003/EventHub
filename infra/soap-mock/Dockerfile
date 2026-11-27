FROM node:22-alpine

WORKDIR /app

COPY infra/soap-mock/package.json ./
RUN npm install --omit=dev

COPY docs/contracts/payments.wsdl ./payments.wsdl
COPY infra/soap-mock/server.mjs ./

RUN chown -R node:node /app
USER node

EXPOSE 4100

CMD ["node", "server.mjs"]
