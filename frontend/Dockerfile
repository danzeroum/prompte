# Imagem do frontend estático: build com Vite + nginx servindo o dist/.
# As VITE_* são públicas (vêm de .env.example); sobrescreva com --build-arg se quiser.

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Usa os valores públicos versionados em .env.example (URL + anon key).
# Para customizar: docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=...
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN if [ -n "$VITE_SUPABASE_URL" ]; then \
      printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n' "$VITE_SUPABASE_URL" "$VITE_SUPABASE_ANON_KEY" > .env; \
    else \
      cp -n .env.example .env || true; \
    fi
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# Healthcheck usando o wget do busybox (presente no nginx:alpine; curl não é).
# Tuning explícito de intervalo/timeout/retries (#M22).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/index.html || exit 1
