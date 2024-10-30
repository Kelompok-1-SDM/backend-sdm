# Use a Node.js image as the base
FROM node:lts-alpine

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Compile TypeScript code
RUN npm run build

# Set the environment to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "dist/index.js"]
