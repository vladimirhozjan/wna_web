##############################################
# Stage 1 – Builder (Node + Vite)
##############################################
FROM node:20 AS web_builder

WORKDIR /src

# SSH support for GitHub clone
RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh \
    && ssh-keyscan github.com >> ~/.ssh/known_hosts

ARG GIT_BRANCH=main
ARG PROJECT_VERSION=d-xxx
ARG APP=main-app

# Clone repo
RUN --mount=type=ssh git clone --depth 1 --branch "${GIT_BRANCH}" \
    git@github.com:vladimirhozjan/wna_web.git .

# Install deps
RUN npm ci

# Build selected frontend app
RUN APP=${APP} npm run build

##############################################
# Stage 2 – Runtime (nginx)
##############################################
FROM nginx:stable AS web_main_app

RUN rm /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY main/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=web_builder /src/dist/main-app/local ./

COPY main/runtime-config.template.js /usr/share/nginx/html/config.js

COPY main/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

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
#COPY --from=web_builder /src/dist/admin-app/production ./
#
#EXPOSE 8081
#CMD ["nginx", "-g", "daemon off;"]

###############################################
## Stage 3 – admin-app runtime (nginx)
###############################################
FROM web_builder AS web_builder_runtime
CMD ["bash"]