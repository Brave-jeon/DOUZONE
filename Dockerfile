FROM node:24-bookworm-slim
WORKDIR /opt/salespilot
COPY app ./app
COPY server ./server
ENV NODE_ENV=production
ENV APP_DATA_DIR=/var/data/salespilot
ENV PORT=10000
EXPOSE 10000
CMD ["node", "server/server.js"]
