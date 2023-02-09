FROM node:16.9.1 as builder
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY . ./
COPY package.json yarn.lock ./
RUN yarn
RUN yarn build

FROM caddy:2-alpine
COPY --from=builder /app/scripts/build/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/build /app