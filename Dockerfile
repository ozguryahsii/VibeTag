# Production image. Only needed for a VPS or a container platform — hosts that
# build Next.js themselves ignore this file entirely.
#
#   docker build -t vibetag .
#   docker run -p 3000:3000 --env-file .env vibetag

# ---------------------------------------------------------------- deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --------------------------------------------------------------- build
FROM node:22-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* is inlined into the bundle at build time, not read at runtime.
# Setting these only in the container's environment leaves them baked as empty
# — push would silently never work and no amount of restarting would fix it.
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---------------------------------------------------------------- run
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Never run the app as root in a container.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# The standalone output carries its own minimal node_modules; static assets
# and public files are not included in it and have to come across separately.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# The generated client and its query engine. Next.js does not trace these, so
# they have to be named explicitly or every database call fails at runtime.
#
# The Prisma *CLI* is deliberately absent. It is not a self-contained binary —
# it pulls in effect, c12, deepmerge-ts and more — and hand-picking those out
# of node_modules is a game with no end. Migrations run from the build stage
# instead, as their own step; see the `migrate` service in
# docker-compose.prod.yml.
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
