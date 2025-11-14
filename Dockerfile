# --- BUILD STAGE ---
FROM node:20 AS build

WORKDIR /app
COPY . .

RUN npm ci
RUN npm run build

# --- RUNTIME STAGE ---
FROM nginx:stable

# Prepišemo default nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiramo build
COPY --from=build /app/dist/main-app/production /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
