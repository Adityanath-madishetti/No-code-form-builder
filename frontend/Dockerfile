FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY vendor ./vendor
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
