# frontend/Dockerfile

FROM node:22 AS base
WORKDIR /app

COPY package*.json ./
COPY fluxoris-partner-mfe-0.1.4.tgz ./
RUN npm install


FROM base AS dev
COPY . .
CMD ["npm", "run", "dev", "--", "--host"]


FROM base AS build
COPY . .
ARG VITE_API_URL
ARG VITE_FLUXORIS_REMOTE_URL
ARG VITE_FLUXORIS_API_BASE_URL
ARG VITE_FLUXORIS_APP_BASE_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FLUXORIS_REMOTE_URL=$VITE_FLUXORIS_REMOTE_URL
ENV VITE_FLUXORIS_API_BASE_URL=$VITE_FLUXORIS_API_BASE_URL
ENV VITE_FLUXORIS_APP_BASE_URL=$VITE_FLUXORIS_APP_BASE_URL
RUN npm run build


FROM node:22 AS prod
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]