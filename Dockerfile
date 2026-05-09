FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server.js ./server.js
COPY src/persona_interview_prompts.json ./src/persona_interview_prompts.json
COPY src/personaRuntime.js ./src/personaRuntime.js
COPY scripts ./scripts
COPY model ./model

EXPOSE 8787

CMD ["node", "server.js"]
