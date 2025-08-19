# Build stage: фронтенд
FROM node:20-bullseye-slim AS web-build
WORKDIR /web
COPY web/package*.json ./
RUN npm config set optional true \
 && npm ci --include=optional \
 || (rm -f package-lock.json && npm install --include=optional)
COPY web/ .
ENV ROLLUP_SKIP_NODE_NATIVE=1 ROLLUP_USE_WASM=1
RUN npm run build

# Runtime: nginx
FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=web-build /web/dist /usr/share/nginx/html
