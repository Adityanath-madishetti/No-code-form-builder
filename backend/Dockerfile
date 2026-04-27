# backend/Dockerfile

FROM node:22 AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci


FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]


FROM base AS build
COPY . .
RUN npm run build


FROM node:22 AS prod
WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 5001
CMD ["node", "dist/src/server.js"]