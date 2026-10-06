FROM node:20-alpine

RUN apk add --no-cache git bash

WORKDIR /app

COPY package.json ./
COPY apps/mobile-app/package.json ./apps/mobile-app/
COPY packages/domain/package.json ./packages/domain/
COPY packages/ui/package.json ./packages/ui/

RUN npm install

COPY . .

# Build domain and ui just in case
RUN cd packages/domain && npm run build || true
RUN cd packages/ui && npm run build || true

EXPOSE 8081

CMD ["npx", "expo", "start", "--web"]
