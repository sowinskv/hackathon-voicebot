FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Build TypeScript (if src/ contains TypeScript)
# RUN npm run build

# Run the service
CMD ["node", "src/index.js"]
