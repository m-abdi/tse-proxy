FROM docker.arvancloud.ir/node:alpine

WORKDIR /app

COPY . .

RUN npm config set registry https://package-mirror.liara.ir/repository/npm/ --global

RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "start"]