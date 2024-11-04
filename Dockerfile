# Use a Node.js image as the base for building
FROM node:lts-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json COPY package*.json .
COPY package*.json .

# Install all dependencies
RUN npm install

# Copy the entire project (including tsconfig.json and source files)
COPY . .

# Compile TypeScript code
RUN npm run build

# Runtime stage
FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Copy only the production node_modules and built files from builder
COPY --from=builder ./app/node_modules ./node_modules
COPY --from=builder ./app/dist .

# Set the environment to production
ENV NODE_ENV=development

# Expose the port that the app runs on
EXPOSE 3000

# Start the app
CMD ["node", "src/index.js"]