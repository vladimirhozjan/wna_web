##############################################
# Stage 1 – Builder (Node + Vite)
##############################################
FROM node:20 AS builder

WORKDIR /src

# SSH support for GitHub cloning (same as backend)
RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

ARG GIT_BRANCH=main
ARG PROJECT_VERSION=d-xxx

# Clone frontend monorepo
RUN --mount=type=ssh git clone --depth 1 --branch "${GIT_BRANCH}" \
    git@github.com:vladimirhozjan/wna_web.git .

# Install dependencies
RUN npm ci

# Build MAIN APP
RUN CLIENT_ENV=production APP=main-app npm run build:main:prod

# Build ADMIN APP
#RUN CLIENT_ENV=production APP=admin-app npm run build:admin:prod


##############################################
# Stage 2a – main-app runtime (nginx)
##############################################
FROM nginx:stable AS web_main_app

RUN rm /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY main/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/dist/main-app/production ./

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
#
#
###############################################
## Stage 2b – admin-app runtime (nginx)
###############################################
#FROM nginx:stable AS web_admin_app
#
#RUN rm /etc/nginx/conf.d/default.conf
#
#WORKDIR /usr/share/nginx/html
#
#COPY config/admin/nginx.conf /etc/nginx/conf.d/default.conf
#COPY --from=builder /src/dist/admin-app/production ./
#
#EXPOSE 8081
#CMD ["nginx", "-g", "daemon off;"]