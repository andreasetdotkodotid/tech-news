FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/apps/web/dist ./apps/web/dist
COPY --from=build --chown=app:app /app/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=app:app /app/apps/worker ./apps/worker
COPY --from=build --chown=app:app /app/scripts ./scripts
COPY --from=build --chown=app:app /app/database ./database
COPY --from=build --chown=app:app /app/package.json ./package.json
USER app
EXPOSE 4321
CMD ["node", "apps/web/dist/server/entry.mjs"]
