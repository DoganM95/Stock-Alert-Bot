FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
RUN mkdir ./server
COPY ./server/package*.json ./server/
RUN cd ./server
RUN npm install
RUN cd ..

# Prepare for production use
RUN npm ci --only=production

# Bundle app source
COPY . ./

# Set permissions
RUN chmod +rwx ./docker/entrypoint.sh

# communication port
EXPOSE 3000

# Start the server
CMD [ "node", "./server/server.js" ]
