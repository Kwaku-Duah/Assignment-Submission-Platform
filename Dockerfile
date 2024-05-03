FROM node:18-bullseye

WORKDIR /app

COPY package.json yarn.lock ./

RUN npm pkg delete scripts.postinstall

COPY prisma/ ./prisma

RUN yarn install

RUN yarn prisma:generate

COPY . .

RUN yarn build

EXPOSE 3004

CMD ["yarn", "start"]
