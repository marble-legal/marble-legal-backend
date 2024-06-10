FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:18-alpine AS app

ENV PHANTOMJS_PATH=/usr/local/bin/phantomjs
RUN apk update && apk add --no-cache fontconfig curl curl-dev && \
    cd /tmp && curl -Ls https://github.com/dustinblackman/phantomized/releases/download/${PHANTOMJS_VERSION}/dockerized-phantomjs.tar.gz | tar xz && \
    cp -R lib lib64 / && \
    cp -R usr/lib/x86_64-linux-gnu /usr/lib && \
    cp -R usr/share /usr/share && \
    cp -R etc/fonts /etc && \
    curl -k -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 | tar -jxf - && \
    cp phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs

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

