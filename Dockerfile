FROM node:12.16.3

RUN mkdir -p /usr/src/app

# Create app directory
WORKDIR /usr/src/app

#Install app dependencies
COPY package.json /usr/src/app

# Install nodemon
RUN npm install -g nodemon

# Install dependencies
RUN npm install


RUN ls /usr/src/app

EXPOSE 8000
CMD ["node", "/app/app.js"]