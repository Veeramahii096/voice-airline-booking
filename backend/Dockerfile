# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose backend port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
