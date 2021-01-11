FROM node:14.15.1

ARG GIT_COMMIT_HASH
ARG GIT_COMMIT_DATE

ENV GIT_COMMIT_HASH=${GIT_COMMIT_HASH}
ENV GIT_COMMIT_DATE=${GIT_COMMIT_HASH}

RUN mkdir -p /usr/src/app

# Create app directory
WORKDIR /usr/src/app

#Install app dependencies
COPY package.json /usr/src/app

# Install dependencies
RUN npm install

EXPOSE 8000
CMD ["node", "/app/app.js"]