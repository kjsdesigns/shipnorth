FROM node:18-alpine

# Install required system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Set working directory
WORKDIR /app

# Copy package files from API
COPY apps/api/package*.json ./apps/api/

# Install API dependencies
WORKDIR /app/apps/api
RUN npm install

# Install dev dependencies for development and testing
RUN npm install --save-dev @playwright/test nodemon tsx

# Copy package files from Web
WORKDIR /app
COPY apps/web/package*.json ./apps/web/

# Install Web dependencies
WORKDIR /app/apps/web
RUN npm install

# Copy root package files
WORKDIR /app
COPY package*.json ./

# Install root dependencies (includes playwright and testing)  
RUN npm install

# Install Playwright browsers (Alpine compatible)
RUN npx playwright install chromium webkit firefox

# Copy the entire application
COPY . .

# Set working directory back to root
WORKDIR /app

# Expose ports
EXPOSE 8849 8850

# Start the application
CMD ["npm", "run", "docker:dev"]