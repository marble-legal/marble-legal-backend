FROM --platform=linux/x86_64 public.ecr.aws/docker/library/node:18-alpine AS app

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PHANTOMJS_VERSION=2.1.1
ENV PHANTOMJS_PATH=/usr/local/bin/phantomjs
RUN apk update && apk add --no-cache tar gzip bzip2 fontconfig curl curl-dev && \
    cd /tmp && curl -Ls https://github.com/topseom/phantomized/releases/download/${PHANTOMJS_VERSION}/dockerized-phantomjs.tar.gz | tar xz && \
    cp -R lib lib64 / && \
    cp -R usr/lib/x86_64-linux-gnu /usr/lib && \
    cp -R usr/share /usr/share && \
    cp -R etc/fonts /etc && \
    curl -k -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 | tar -jxf - && \
    cp phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /work/

COPY ./package.json /work/package.json

RUN npm install

COPY . /work/

RUN apk add --update python3 make g++\
   && rm -rf /var/cache/apk/*

RUN npm install

RUN npm uninstall bcrypt

RUN npm install bcrypt --save

# build application
RUN npm run build

RUN npm install -g copyfiles

RUN copyfiles --up 1 src/**/*.html dist

EXPOSE 3001
CMD NODE_OPTIONS=--max_old_space_size=4096 node dist/main.js

