FROM node:14.15.1

RUN mkdir -p /usr/articleblog

# Create app directory
WORKDIR /usr/articleblog

#Install app dependencies
COPY package.json /usr/articleblog

# Install dependencies
RUN npm install

EXPOSE 8000

CMD ["node", "app/app.js"]