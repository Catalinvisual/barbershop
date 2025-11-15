FROM node:20-alpine

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install --ignore-scripts

# Install client dependencies using cache
COPY client/package*.json ./client/
RUN npm --prefix client install

# Copy source code
COPY . .

# Build client for production
RUN npm --prefix client run build

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Start the server which serves API and built client
CMD ["npm", "start"]