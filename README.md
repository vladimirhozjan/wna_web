# WNA Web -- Frontend

WNA Web is a **multi-app Vue 3 + Vite 7** frontend project optimized
for:

-   ✔ multiple applications (`main-app`, `admin-app`)\
-   ✔ multiple environments (`local`, `development`, `production`)\
-   ✔ production code obfuscation\
-   ✔ Docker + Nginx runtime\
-   ✔ GKE (Google Kubernetes Engine) deployment\
-   ✔ SPA routing with fallback

------------------------------------------------------------------------

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
    - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
    - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
    - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
    - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

------------------------------------------------------------------------

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

------------------------------------------------------------------------

# Project Structure

    project/
    │
    ├─ apps/
    │   ├─ main-app/
    │   │   ├─ index.html
    │   │   └─ src/
    │   ├─ admin-app/
    │       ├─ index.html
    │       └─ src/
    │
    ├─ config/
    │   ├─ vite.core.js
    │   ├─ apps.js
    │   ├─ domains.js
    │
    ├─ dist/
    │   └─ (generated builds)
    │
    ├─ vite.config.js
    ├─ package.json
    ├─ Dockerfile
    └─ nginx.conf

------------------------------------------------------------------------

# Installation

## Requirements

-   Node **20.19+**
-   npm / yarn / pnpm
-   Docker (for production build)
-   Kubernetes + GKE (for deployment)

## Install dependencies

``` bash
    npm ci
```

------------------------------------------------------------------------

# Local Development

Start Vite dev server:

``` bash
    npm run dev
```

Default address:

    http://localhost:5173

------------------------------------------------------------------------

# Environment Variables

You can use `.env.local`, `.env.development`, `.env.production`.

Example:

    APP=main-app

-   `APP` selects which frontend app to build.

------------------------------------------------------------------------

# Build Commands

## Generic build

``` bash
    npm run build
```

## Environment-specific builds

``` bash
    npm run build:local
    npm run build:dev
    npm run build:prod
```

## App-specific builds

``` bash
    npm run build:main
    npm run build:admin
```

## Combined (environment + app)

``` bash
    npm run build:main:prod
    npm run build:admin:dev
```

------------------------------------------------------------------------

# Production Obfuscation

The project uses:

-   **Terser** (minification + mangle)
-   **rollup-plugin-obfuscator** (advanced obfuscation)

Obfuscation activates **automatically in production mode**.

Manual trigger:

``` bash
    npm run obfuscate
```

------------------------------------------------------------------------

# Injected Runtime Domains

Compile-time domain injection:

``` js
console.log(__APP_DOMAIN__)
console.log(__API_DOMAIN__)
```

Axios example:

``` js
import axios from 'axios'

export const api = axios.create({
  baseURL: __API_DOMAIN__
})
```

------------------------------------------------------------------------

# Docker (GKE-ready, no SSL)

Since GKE Ingress terminates HTTPS, Nginx listens only on HTTP.

## Build Docker image:

``` bash
    docker build -t wna-web .
```

## Local test:

``` bash
    docker run -p 8080:8080 wna-web
```

Access app:

    http://localhost:8080

------------------------------------------------------------------------

# Nginx Configuration

`nginx.conf`:

``` nginx
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

------------------------------------------------------------------------

# GKE Deployment

## Deployment

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wna-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: wna-web
  template:
    metadata:
      labels:
        app: wna-web
    spec:
      containers:
        - name: wna-web
          image: gcr.io/YOUR_PROJECT/wna-web:latest
          ports:
            - containerPort: 8080
```

## Service

``` yaml
apiVersion: v1
kind: Service
metadata:
  name: wna-web-service
spec:
  type: NodePort
  selector:
    app: wna-web
  ports:
    - port: 8080
      targetPort: 8080
```

## Ingress + Managed Certificate

``` yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wna-web
  annotations:
    kubernetes.io/ingress.class: "gce"
    networking.gke.io/managed-certificates: wna-cert
spec:
  rules:
    - host: dev.whatsnextaction.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: wna-web-service
                port:
                  number: 8080
```

### ManagedCertificate

``` yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: wna-cert
spec:
  domains:
    - dev.whatsnextaction.com
```

------------------------------------------------------------------------

# Utilities

Clean build folder:

``` bash
    npm run clean
```

------------------------------------------------------------------------

# Debug Production Build (without obfuscation)

``` bash
    vite build --mode staging
```


