# Будуємо на Debian (glibc), щоб уникнути musl-граблів
FROM node:20-bullseye-slim AS web-build
WORKDIR /usr/src/app

# Важливо: optional=true, бо @rollup/* платформи — optional deps
COPY package*.json ./
RUN npm config set optional true \
 && npm ci --include=optional \
 || (rm -f package-lock.json && npm install --include=optional)

# Код і білд
COPY . .
# Форсимо не використовувати native-роллап (або wasm-фолбек)
ENV ROLLUP_SKIP_NODE_NATIVE=1 ROLLUP_USE_WASM=1
RUN npm run build
