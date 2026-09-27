# Use official Node.js runtime for building/running development
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite dev server with the host flag allowed
CMD ["npm", "run", "dev", "--", "--host"]
