# Use the official Node.js 22 image (Alpine version) as the build environment
FROM node:22-alpine AS builder

# Enable corepack, which helps manage package managers like pnpm
RUN corepack enable

# Set the working directory inside the container to /app
WORKDIR /app

# Copy all files from your project directory into the container's /app directory
COPY . .

# Install project dependencies using pnpm
RUN pnpm install

# Build the application (for example, compiles source code and bundles files)
RUN npm run build

# Use the official Nginx image (Alpine version) for serving the built app
FROM nginx:1.28.0-alpine AS production

# Copy the Nginx configuration template into the correct directory inside the container
COPY ./nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy the built application files from the builder stage to the directory Nginx serves static files from
COPY --from=builder /app/dist /usr/share/nginx/html