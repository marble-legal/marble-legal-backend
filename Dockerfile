FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:18-alpine AS app

WORKDIR /work/

COPY ./package.json /work/package.json

RUN npm install

COPY . /work/

# build application
RUN npm run build

RUN npm install -g copyfiles

RUN copyfiles --up 1 src/**/*.html dist

EXPOSE 3001
CMD NODE_OPTIONS=--max_old_space_size=4096 node dist/main.js

