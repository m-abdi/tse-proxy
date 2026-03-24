FROM node:alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --frozen-lockfile

EXPOSE 3000

CMD ["npm", "run", "start"]