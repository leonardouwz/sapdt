FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . .
# las variables VITE_* se leen de .env.production durante el build
RUN NITRO_PRESET=node-server npx vite build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV HOST=0.0.0.0
CMD ["node", ".output/server/index.mjs"]
