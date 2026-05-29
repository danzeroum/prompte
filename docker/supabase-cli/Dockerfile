# Supabase CLI em container — sem instalar nada global na VPS.
# Use node:20-slim (glibc) para evitar problemas do binário do supabase em musl/alpine.
FROM node:20-slim

RUN npm install -g supabase

WORKDIR /workspace
ENTRYPOINT ["supabase"]
