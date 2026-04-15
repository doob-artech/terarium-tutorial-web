FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

COPY package*.json ./
RUN npm install --omit=dev

COPY dist ./dist
COPY server.js ./server.js
COPY src/persona_interview_prompts.json ./src/persona_interview_prompts.json

EXPOSE 8787

CMD ["node", "server.js"]
