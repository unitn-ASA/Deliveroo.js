FROM node:22.14.0
LABEL author="Marco Robol <marco.robol@unitn.it>"

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    jq # Aggiunge jq per elaborare file JSON

RUN mkdir -p /app
COPY . /app
WORKDIR /app
RUN npm install && \
    npm run build && \
    cd frontend && rm -rf node_modules &&  cd .. \
    npm prune --production && \
    cd backend && npm prune --production

EXPOSE  $PORT

CMD ["npm", "start"]