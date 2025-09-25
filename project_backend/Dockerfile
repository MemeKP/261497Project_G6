# Use the official Node.js 22 image based on Alpine Linux for a small, efficient base
FROM node:22-alpine

# Install the libc6-compat package for better compatibility with some Node.js native modules
# See: https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat

# Enable corepack, a tool included with Node.js to manage package managers like pnpm
RUN corepack enable

# Set the working directory inside the container to /app
WORKDIR /app

# Copy all files from your project directory on your computer to the /app directory in the container
COPY . .

# Install dependencies using pnpm and clean up the pnpm store to reduce image size
RUN pnpm install && pnpm store prune

# Build the application (usually compiles TypeScript, bundles assets, etc.)
RUN npm run build

# Set environment variable NODE_ENV to 'production' for best performance and security
ENV NODE_ENV production

# Set environment variable PORT to 3000 (the port your app will listen on)
ENV PORT 3000

# Expose port 3000 so Docker knows which port the app runs on
EXPOSE 3000

# Specify the default command to run when the container starts: start the app using npm
CMD ["npm", "run", "start"]
