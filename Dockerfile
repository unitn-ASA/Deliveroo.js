FROM node:22.16.0-slim
LABEL author="Marco Robol <marco.robol@unitn.it>"

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    git \
    jq # Aggiunge jq per elaborare file JSON \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app
COPY . /app
WORKDIR /app
RUN rm -rf /app/node_modules && rm -rf /app/backend/node_modules && rm -rf /app/frontend/node_modules \
    npm install && \
    npm run build && \
    cd frontend && rm -rf node_modules &&  cd .. \
    npm prune --production && \
    cd backend && npm prune --production

EXPOSE  $PORT

CMD ["npm", "start"]