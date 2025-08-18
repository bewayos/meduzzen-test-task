FROM node:20-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
# Vite dev server will run in container; nginx proxies to it
CMD ["npm","run","dev","--","--host"]
