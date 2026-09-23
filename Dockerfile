# The API image.
#
# Built on the Lightsail box itself (`docker compose build`) rather than
# pushed through ECR: there is one instance, so a registry would be a second
# thing to keep in step for no gain, and building in place sidesteps
# cross-architecture surprises entirely.
#
# Two stages. The build stage carries the TypeScript compiler, the Prisma CLI
# and every devDependency; the runtime stage carries none of them.

FROM node:22-slim AS build
WORKDIR /app

# `prisma generate` loads prisma.config.ts, which reads DATABASE_URL and would
# otherwise see `undefined`. Generation never opens a connection, so a dummy
# value is enough — the same trick .github/workflows/ci.yml uses.
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"

# Manifests and the schema first, so a source-only change reuses the cached
# install layer. prisma.config.ts is here because the CLI reads it.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# --ignore-scripts, then generate explicitly. The postinstall hook would run
# `prisma generate` on its own, but `prepare` would also run husky, which has
# no .git to install into inside an image and fails the build. Doing it by
# hand keeps both under control.
RUN npm ci --ignore-scripts && npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drops typescript, tsx, husky and the @types packages but leaves the
# generated client where the runtime expects it.
RUN npm prune --omit=dev


FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# services/assistant.ts reads ../../content/handbook.md relative to its own
# compiled path, so the handbook has to sit beside dist/, not inside it.
COPY content ./content

# Nothing is written to disk at runtime — a resume upload is parsed in memory
# and never stored (see lib/resume-files.ts) — so the process needs no write
# access to the image.
USER node

EXPOSE 3001

# The compose healthcheck polls this; Caddy only forwards once it passes.
CMD ["node", "dist/index.js"]
