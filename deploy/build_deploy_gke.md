# WhatsNextAction -- Frontend Build & Deploy Guide

Ta dokument opisuje celoten proces local/dev/prod builda, verzioniranja,
dockerizacije in deploya frontend aplikacije (`main-app`) na GKE.

## 1. Build (local/dev/prod)

Razlike med okolji se nastavijo preko: - APP_DOMAIN - API_DOMAIN -
PROJECT_VERSION

### Local build

```shell
  PROJECT_VERSION=0.0.1\
  API_DOMAIN=http://localhost:8000\
  docker-compose build

```

### Develop build

```shell
  PROJECT_VERSION=1.0.0\
  API_DOMAIN=https://dev-api.whatsnextaction.com\
  docker-compose build
```

### Production build

```shell
  PROJECT_VERSION=1.0.0\
  API_DOMAIN=https://api.whatsnextaction.com\
  docker-compose build
```

## 2. Local run

```shell 
  PROJECT_VERSION=0.0.4\
  API_DOMAIN=http://localhost:8000\
  docker-compose up 
```

Dostop: http://localhost:8080

## 3. Deploy na GKE

./build_deploy_gke_frontend.sh 0.0.18

# Datoteke vključene v proces

-   Dockerfile
-   docker-compose.yml
-   entrypoint.sh
-   runtime-config.template.js
-   build_deploy_gke_frontend.sh
