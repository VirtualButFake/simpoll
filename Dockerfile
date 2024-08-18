FROM node:16-alpine

WORKDIR /usr/app

COPY package.json ./
COPY package-lock.json  ./

RUN npm i

COPY . .

# build
RUN npm run build

EXPOSE 3000
CMD [ "npm", "run", "start" ]
