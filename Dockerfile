FROM node:7

# Create app directory
WORKDIR /app

# Add packages so Docker won't have to install dependencies again
COPY package.json /app
COPY package-lock.json /app

# Install necessary packages
RUN npm install

# Bundle app source
COPY . /app

ENTRYPOINT ["node", "index.js"]
