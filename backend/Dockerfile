# Use standard lightweight alpine base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy dependency mappings
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source repository
COPY . .

# Expose server listener port
EXPOSE 5000

# Execute server startup command
CMD ["node", "src/server.js"]
