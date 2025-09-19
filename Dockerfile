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
ENV GOOGLE_CLIENT_ID="build-time-client-id"
ENV GOOGLE_CLIENT_SECRET="build-time-client-secret"
ENV CLOUDINARY_CLOUD_NAME="build-time-cloud"
ENV CLOUDINARY_API_KEY="123456789"
ENV CLOUDINARY_API_SECRET="build-time-secret"
ENV NEXT_PUBLIC_API_BASE_URL="http://localhost:8085/api"

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