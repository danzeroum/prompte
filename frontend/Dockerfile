# Imagem do frontend estático: build com Vite + nginx servindo o dist/.
# As VITE_* são públicas (vêm de .env.example); sobrescreva com --build-arg se quiser.

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# A API é mesma origem (/api por padrão). Sobrescreva com --build-arg se preciso.
ARG VITE_API_URL=/api
RUN printf 'VITE_API_URL=%s\n' "$VITE_API_URL" > .env
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# Healthcheck usando o wget do busybox (presente no nginx:alpine; curl não é).
# Usa 127.0.0.1 explícito (não localhost) — o nginx:alpine pode escutar só em
# IPv4 enquanto o busybox resolve localhost para ::1, causando Connection refused.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/index.html || exit 1
