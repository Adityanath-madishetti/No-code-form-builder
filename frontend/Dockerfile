# frontend/Dockerfile

FROM node:22 AS base
WORKDIR /app

COPY package*.json ./
COPY fluxoris-partner-mfe-0.1.4.tgz ./
RUN npm ci


FROM base AS dev
COPY . .
CMD ["npm", "run", "dev", "--", "--host"]


FROM base AS build
COPY . .
RUN npm run build


FROM node:22 AS prod
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]