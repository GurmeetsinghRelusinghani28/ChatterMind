# Use official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your backend runs on (e.g., 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 
