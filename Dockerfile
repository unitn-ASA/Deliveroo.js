FROM node:22.14.0
MAINTAINER Marco Robol <marco.robol@unitn.it>

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

RUN mkdir -p /app
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build

EXPOSE  $PORT

CMD ["npm", "start"]