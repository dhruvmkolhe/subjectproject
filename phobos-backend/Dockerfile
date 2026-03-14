FROM node:20-slim

RUN apt-get update && apt-get install -y \
    curl \
    libimage-exiftool-perl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://rclone.org/install.sh | bash

WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci

COPY src ./src
COPY README.md .
RUN npm run build

RUN mkdir -p /data/watch /data/clean

ENV NODE_ENV=production
ENV DAEMON_MODE=true
ENV WATCH_DIR=/data/watch
ENV OUTPUT_DIR=/data/clean
ENV RCLONE_REMOTE_NAME=gdrive
ENV RCLONE_DEST_PATH=backups
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

CMD ["node", "dist/main.js"]
