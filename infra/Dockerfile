# Start from a lightweight Node image
FROM node:18-alpine

# Create a directory for our app
WORKDIR /app

# Copy package.json and package-lock.json, then install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 8080 (not strictly required for Cloud Run, but good practice)
EXPOSE 8080

# Start the server by default
CMD ["node", "server.js"]
