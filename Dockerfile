FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .

# Set environment variables for build time
ENV NODE_ENV=production
ENV DATABASE_URL="mongodb://localhost:27017/oasismarineuae"
ENV NEXTAUTH_URL="http://localhost:8085"
ENV NEXTAUTH_SECRET="build-time-secret"
ENV GOOGLE_CLIENT_ID="340582698147-5l9jh64jevsenrsh3h1cetq8pns9esia.apps.googleusercontent.com"
ENV GOOGLE_CLIENT_SECRET="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"
ENV CLOUDINARY_CLOUD_NAME="dpdl6z0hu"
ENV CLOUDINARY_API_KEY="747177874958951"
ENV CLOUDINARY_API_SECRET="7dIbrxc06KTo0Iup08_OLhSnI3k"
ENV NEXT_PUBLIC_API_BASE_URL="http://localhost:8085/api"
ENV NEXTAUTH_URL="https://oasismarineuae.com"
ENV NEXT_PUBLIC_API_BASE_URL="https://oasismarineuae.com/api"


RUN npm run build


# -- Production image --
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8085

# Runtime environment variables will be provided by docker-compose or deployment platform
# No hardcoded secrets in Dockerfile

# Add user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 8085

CMD ["npm", "run", "start"]
