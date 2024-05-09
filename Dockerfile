FROM node:21.1.0
MAINTAINER Marco Robol <marco.robol@unitn.it>

RUN mkdir -p /usr/api
COPY . /usr/api
WORKDIR /usr/api
RUN npm install

ENV LEVEL challenge_21
EXPOSE  $PORT

CMD ["npm", "start"]