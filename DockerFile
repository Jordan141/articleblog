FROM node:12.16.3

# Create app directory
WORKDIR /usr/src/app

#Install app dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 8000
CMD ["npm", "start"]