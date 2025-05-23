FROM node:lts-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# Bundle app source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose no ports - using stdio for communication

# Start the MCP server
CMD [ "npm", "start" ]