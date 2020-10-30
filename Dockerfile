FROM node:lts

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn

COPY . .

CMD [ "node", "." ]
