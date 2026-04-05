# WNA Web — Frontend

WNA Web is a **multi-app Vue 3 + Vite 7** frontend project optimized for:

- multiple applications (`main-app`, `admin-app`)
- multiple environments (`development`, `production`)
- Docker + Nginx runtime
- GKE (Google Kubernetes Engine) deployment
- SPA routing with fallback

---

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
    - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
    - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
    - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
    - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

---

## Project Structure

```
wna_web/
├── config/
│   ├── vite.core.js        # Shared Vite config factory (aliases, minification, proxy)
│   └── apps.js             # App definitions (root dir, port, proxy targets)
├── src/
│   ├── main-app/           # User-facing GTD application
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── router/
│   │   ├── layouts/
│   │   ├── views/
│   │   ├── components/
│   │   ├── scripts/
│   │   └── styles/
│   └── admin-app/          # Internal admin panel
│       ├── index.html
│       ├── main.js
│       ├── router/
│       ├── layouts/
│       ├── views/
│       ├── components/
│       ├── scripts/
│       └── styles/
├── dist/                   # Generated builds
├── vite.config.js          # Entry point (reads APP env var)
├── package.json
├── Dockerfile
└── nginx.conf
```

---

## Requirements

- Node `^20.19.0 || >=22.12.0`
- npm

## Install Dependencies

```bash
npm ci
```

---

## Local Development

```bash
npm run dev:main          # Start main-app  → http://localhost:6222
npm run dev:admin         # Start admin-app → http://localhost:7222
```

The dev server uses Vite proxy to forward API requests:
- main-app: `/v1/*` → `http://localhost:8000` (router_service)
- admin-app: `/auth/*`, `/admin/*` → `http://localhost:8004` (admin_service)

---

## Environment Variables

App selection is via the `APP` env var (set automatically by the npm scripts):

```
APP=main-app    # or admin-app
```

---

## Build Commands

```bash
npm run build:main        # Build main-app  → dist/main-app/
npm run build:admin       # Build admin-app → dist/admin-app/
npm run clean             # Remove dist folder
```

---

## Runtime Configuration

Both apps load runtime configuration from `/config.js`, which is **not** part of the build output. It is injected at deployment time (mounted into the Nginx container via ConfigMap).

This allows the same Docker image to run in different environments by changing only the config.

### main-app config.js

```javascript
window.RUNTIME_CONFIG = {
  API_DOMAIN: "https://api-dev.whatsnextaction.com",
  GOOGLE_CLIENT_ID: "783327214800-xxx.apps.googleusercontent.com"
};
```

### admin-app config.js

```javascript
window.RUNTIME_CONFIG = {
  ADMIN_API_DOMAIN: "https://admin-dev.whatsnextaction.com"
};
```

---

## Production Obfuscation

The project uses:

- **Terser** (minification + mangle, console/debugger stripped)
- **rollup-plugin-obfuscator** (advanced obfuscation — configured but currently disabled, see `config/vite.core.js:9`)

---

## Docker

Since GKE Ingress terminates HTTPS, Nginx listens only on HTTP (port 8080).

### Build Docker image

```bash
# main-app
docker build --build-arg APP=main-app -t wna-web-main .

# admin-app
docker build --build-arg APP=admin-app -t wna-web-admin .
```

### Local test

```bash
docker run -p 8080:8080 -v $(pwd)/config.main.js:/usr/share/nginx/html/config.js:ro wna-web-main
docker run -p 8081:8080 -v $(pwd)/config.admin.js:/usr/share/nginx/html/config.js:ro wna-web-admin
```

---

## Nginx Configuration

`nginx.conf`:

```nginx
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /config.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

---

## GKE Deployment

Full Kubernetes manifests (Deployments, Services, Ingress, ConfigMaps, ManagedCertificates) for both apps are documented in `.claude/ci.md`.

| App       | Domain (dev)                  | Domain (prod)               |
|-----------|-------------------------------|------------------------------|
| main-app  | `dev.whatsnextaction.com`      | `whatsnextaction.com`         |
| admin-app | `admin-dev.whatsnextaction.com`| `admin.whatsnextaction.com`   |

---

## Utilities

Clean build folder:

```bash
npm run clean
```