FROM node:24-bookworm-slim
WORKDIR /opt/salespilot
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY app ./app
COPY server ./server
ENV NODE_ENV=production
ENV APP_DATA_DIR=/tmp/salespilot
ENV PORT=10000
EXPOSE 10000
CMD ["node", "server/server.js"]
