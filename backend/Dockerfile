# Node 22 LTS
FROM node:22-bookworm-slim

# Set working dir
WORKDIR /backend

# Install production deps (cached)
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Create cache directory and set permissions
RUN mkdir -p /backend/node_modules/@huggingface/transformers/.cache && \
    chown -R node:node /backend/node_modules

# Drop privileges for runtime
USER node

# Expose app port
EXPOSE 4000

# Start
CMD ["npm", "start"]