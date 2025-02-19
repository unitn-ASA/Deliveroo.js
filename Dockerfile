FROM node:21.1.0
MAINTAINER Marco Robol <marco.robol@unitn.it>

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

RUN mkdir -p /usr/api
COPY . /usr/api
WORKDIR /usr/api
RUN npm install

EXPOSE  $PORT

CMD ["npm", "start"]