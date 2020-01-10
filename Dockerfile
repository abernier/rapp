FROM node:12-alpine AS base
RUN apk update && apk upgrade && \
  apk add --no-cache \
    openssh-client \
    python g++ \
    tree

WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json yarn.lock ./
RUN yarn install

COPY . ./

#
# dev target
#

FROM base AS dev
EXPOSE 3000
CMD ["yarn", "start"]

FROM base AS server
RUN yarn build
RUN tree build

#
# server target
#

# https://hub.docker.com/_/nginx#hosting-some-simple-static-content
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
COPY nginx.react.conf /etc/nginx

ARG SSL_KEY
ARG SSL_CRT
# RUN apk update && apk upgrade && apk add --no-cache openssl
# RUN openssl req -x509 -nodes -days 3650 -subj "/C=CA/ST=QC/O=Matchbox, Inc./CN=localhost" -addext "subjectAltName=DNS:localhost,IP:10.0.0.201" -newkey rsa:2048 -keyout /etc/ssl/private/nginx.key -out /etc/ssl/certs/nginx.crt
RUN echo "$SSL_KEY" > /etc/ssl/private/nginx.key && chmod 600 /etc/ssl/private/nginx.key
RUN echo "$SSL_CRT" > /etc/ssl/certs/nginx.crt

COPY --from=server /app/build /usr/share/nginx/html

EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]