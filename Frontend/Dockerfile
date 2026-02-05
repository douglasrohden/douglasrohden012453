# Build stage
FROM node:20.19-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (using --legacy-peer-deps due to React 19 compatibility issues)
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Set build-time environment variables for Vite
ARG VITE_API_URL=http://localhost:3001/v1
ENV VITE_API_URL=$VITE_API_URL

# Build the application with TypeScript checks enabled
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
