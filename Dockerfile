FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .

# Set environment variables for build time
# These will be provided by docker-compose or build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_API_BASE
ARG JWT_SECRET
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD_HASH

ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
ENV CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV JWT_SECRET=$JWT_SECRET
ENV ADMIN_EMAIL=$ADMIN_EMAIL
ENV ADMIN_PASSWORD_HASH=$ADMIN_PASSWORD_HASH

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
