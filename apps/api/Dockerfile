FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare yarn@4.17.1 --activate

COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN yarn install --immutable

COPY apps/api apps/api
COPY packages/typescript-config packages/typescript-config
RUN yarn workspace api build \
    && yarn workspaces focus api --production \
    && mkdir -p apps/api/node_modules

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/api
COPY --from=build --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/apps/api/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/api/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]
