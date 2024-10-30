# Use a Node.js image as the base for building
FROM node:lts-alpine as builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript code
RUN npm run build

# Runtime stage
FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Copy only the production node_modules and built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Set the environment to production
ENV NODE_ENV=production

# Expose the port that the app runs on
EXPOSE 3000

# Start the app
CMD ["node", "dist/src/index.js"]
