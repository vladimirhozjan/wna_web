# CI/CD & Deployment — WNA Web (main-app & admin-app)

This document contains everything the CI AI agent needs to build Docker images and deploy both frontend applications to GKE.

---

## 1. Repository Overview

**Repo:** `wna_web` — Vue 3 + Vite 7 monorepo with two frontend applications.

| App | Source | Build Output | Port (container) | Domain (dev) | Domain (prod) |
|-----|--------|-------------|-------------------|--------------|----------------|
| main-app | `src/main-app/` | `dist/main-app/` | 8080 | `dev.whatsnextaction.com` | `whatsnextaction.com` |
| admin-app | `src/admin-app/` | `dist/admin-app/` | 8081 | `admin-dev.whatsnextaction.com` | `admin.whatsnextaction.com` |

Both apps are SPAs served by Nginx. Each gets its own Docker image, Kubernetes deployment, and ingress.

---

## 2. Build Commands

**Prerequisites:**
- Node.js `^20.19.0 || >=22.12.0`
- npm (comes with Node)

**Build steps:**
```bash
npm ci                          # Install dependencies (clean install, uses package-lock.json)
APP=main-app npm run build      # Build main-app → dist/main-app/
APP=admin-app npm run build     # Build admin-app → dist/admin-app/
```

Equivalent to:
```bash
APP=main-app vite build
APP=admin-app vite build
```

**Environment variables at build time:**
| Variable | Description | Example |
|----------|-------------|---------|
| `APP` | Which app to build | `main-app` or `admin-app` |
| `PROJECT_VERSION` | Version string injected as `__APP_VERSION__` | `1.2.3` or git tag |


**Build output:** Static files (HTML, JS, CSS, fonts, images) in `dist/<app-name>/`. The `index.html` references hashed assets in `assets/` subdirectory.

---

## 3. Runtime Configuration

Both apps load runtime configuration from `/config.js` which is **NOT** part of the build output. It must be injected at deployment time (mounted into the Nginx container).

This allows the same Docker image to run in different environments (dev, staging, prod) by changing only the config.

### main-app config.js
```javascript
window.RUNTIME_CONFIG = {
  API_DOMAIN: "https://api-dev.whatsnextaction.com",
  GOOGLE_CLIENT_ID: "783327214800-xxx.apps.googleusercontent.com",
  PAGE_SIZE: 10
};
```

| Field | Dev | Prod |
|-------|-----|------|
| `API_DOMAIN` | `https://api-dev.whatsnextaction.com` | `https://api.whatsnextaction.com` |
| `GOOGLE_CLIENT_ID` | (dev client ID) | (prod client ID) |
| `PAGE_SIZE` | `10` | omitted (defaults to `50`) |

### admin-app config.js
```javascript
window.RUNTIME_CONFIG = {
  ADMIN_API_DOMAIN: "https://admin-dev.whatsnextaction.com"
};
```

| Field | Dev | Prod |
|-------|-----|------|
| `ADMIN_API_DOMAIN` | `https://admin-dev.whatsnextaction.com` | `https://admin.whatsnextaction.com` |

**Note:** admin-app does NOT need `GOOGLE_CLIENT_ID` (no social login). The admin backend (`admin_service`) runs on port 8004 and is accessed directly (not through router_service).

---

## 4. Nginx Configuration

Both apps are SPAs with client-side routing (Vue Router in history mode). Nginx must serve `index.html` for all routes that don't match a static file.

### nginx.conf (same for both apps)
```nginx
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        image/svg+xml
        font/woff2;

    # Cache static assets aggressively (hashed filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html and config.js (must always be fresh)
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location = /config.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # SPA fallback - serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint for Kubernetes
    location = /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

**Key points:**
- Listen on port **8080** (standard for GKE HTTP containers — no SSL in container, GKE Ingress terminates HTTPS)
- Admin-app uses the same nginx.conf (port 8080 inside the container; the K8s service maps it to the desired external port)
- `try_files` rule ensures Vue Router history mode works
- `/healthz` endpoint for Kubernetes liveness/readiness probes
- Hashed assets (`/assets/`) are cached for 1 year (immutable — filename changes on content change)
- `index.html` and `config.js` are never cached (config changes per environment, index.html references new asset hashes on deploy)

---

## 5. Dockerfile

One Dockerfile at repo root, parameterized by build arg for which app to build.

### Dockerfile
```dockerfile
# --- Stage 1: Build ---
FROM node:22-alpine AS build

ARG APP=main-app
ARG PROJECT_VERSION=dev

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Build the specified app
ENV APP=${APP}
ENV PROJECT_VERSION=${PROJECT_VERSION}
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:1.27-alpine

ARG APP=main-app

# Remove default nginx config and html
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist/${APP}/ /usr/share/nginx/html/

# config.js placeholder (overridden at deploy time via ConfigMap mount)
RUN echo 'window.RUNTIME_CONFIG = {};' > /usr/share/nginx/html/config.js

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### Build commands
```bash
# main-app
docker build --build-arg APP=main-app --build-arg PROJECT_VERSION=1.0.0 -t gcr.io/PROJECT_ID/wna-web-main:1.0.0 .

# admin-app
docker build --build-arg APP=admin-app --build-arg PROJECT_VERSION=1.0.0 -t gcr.io/PROJECT_ID/wna-web-admin:1.0.0 .
```

### Local testing
```bash
# main-app
docker run -p 8080:8080 -v $(pwd)/config.main.js:/usr/share/nginx/html/config.js:ro gcr.io/PROJECT_ID/wna-web-main:1.0.0

# admin-app
docker run -p 8081:8080 -v $(pwd)/config.admin.js:/usr/share/nginx/html/config.js:ro gcr.io/PROJECT_ID/wna-web-admin:1.0.0
```

---

## 6. Kubernetes Manifests

### 6.1 main-app

#### ConfigMap (runtime config)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wna-web-main-config
  namespace: wna
data:
  config.js: |
    window.RUNTIME_CONFIG = {
      API_DOMAIN: "https://api-dev.whatsnextaction.com",
      GOOGLE_CLIENT_ID: "783327214800-xxx.apps.googleusercontent.com"
    };
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wna-web-main
  namespace: wna
  labels:
    app: wna-web-main
spec:
  replicas: 2
  selector:
    matchLabels:
      app: wna-web-main
  template:
    metadata:
      labels:
        app: wna-web-main
    spec:
      containers:
        - name: wna-web-main
          image: gcr.io/PROJECT_ID/wna-web-main:latest
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: config
              mountPath: /usr/share/nginx/html/config.js
              subPath: config.js
              readOnly: true
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 3
            periodSeconds: 5
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
      volumes:
        - name: config
          configMap:
            name: wna-web-main-config
```

#### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: wna-web-main
  namespace: wna
spec:
  type: NodePort
  selector:
    app: wna-web-main
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
```

#### ManagedCertificate
```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: wna-web-main-cert
  namespace: wna
spec:
  domains:
    - dev.whatsnextaction.com
```

#### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wna-web-main-ingress
  namespace: wna
  annotations:
    networking.gke.io/managed-certificates: wna-web-main-cert
    kubernetes.io/ingress.class: gce
spec:
  rules:
    - host: dev.whatsnextaction.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: wna-web-main
                port:
                  number: 8080
```

### 6.2 admin-app

#### ConfigMap (runtime config)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wna-web-admin-config
  namespace: wna
data:
  config.js: |
    window.RUNTIME_CONFIG = {
      ADMIN_API_DOMAIN: "https://admin-dev.whatsnextaction.com"
    };
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wna-web-admin
  namespace: wna
  labels:
    app: wna-web-admin
spec:
  replicas: 2
  selector:
    matchLabels:
      app: wna-web-admin
  template:
    metadata:
      labels:
        app: wna-web-admin
    spec:
      containers:
        - name: wna-web-admin
          image: gcr.io/PROJECT_ID/wna-web-admin:latest
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: config
              mountPath: /usr/share/nginx/html/config.js
              subPath: config.js
              readOnly: true
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 3
            periodSeconds: 5
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
      volumes:
        - name: config
          configMap:
            name: wna-web-admin-config
```

#### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: wna-web-admin
  namespace: wna
spec:
  type: NodePort
  selector:
    app: wna-web-admin
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
```

#### ManagedCertificate
```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: wna-web-admin-cert
  namespace: wna
spec:
  domains:
    - admin-dev.whatsnextaction.com
```

#### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wna-web-admin-ingress
  namespace: wna
  annotations:
    networking.gke.io/managed-certificates: wna-web-admin-cert
    kubernetes.io/ingress.class: gce
spec:
  rules:
    - host: admin-dev.whatsnextaction.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: wna-web-admin
                port:
                  number: 8080
```

---

## 7. Network & Security Notes

### admin-app Access Restriction
The admin panel should only be accessible from trusted networks. Options:

1. **GKE Ingress with IP allowlist** (recommended for V1):
   ```yaml
   # Add to admin ingress annotations
   nginx.ingress.kubernetes.io/whitelist-source-range: "1.2.3.4/32,5.6.7.8/32"
   ```
   Or use GCP Cloud Armor security policy attached to the backend service.

2. **VPN-only access** (recommended for production):
   - Admin domain resolves to internal IP only accessible via VPN
   - No public internet access to admin panel

3. **Cloud Armor WAF** (for additional protection):
   - Rate limiting
   - Geo-blocking
   - Bot detection

### CORS
- Admin frontend at `admin-dev.whatsnextaction.com` talks to `admin_service` also at `admin-dev.whatsnextaction.com` (same domain) — no CORS issues if backend is served through the same ingress or same domain.
- If backend is on a separate domain/port, the `admin_service` must set appropriate CORS headers.

### HTTPS
- GKE Ingress terminates TLS via ManagedCertificate
- Container serves HTTP on port 8080 (no SSL in container)
- All external traffic is HTTPS (enforced by ingress)

---

## 8. CI Pipeline Steps

Suggested pipeline (GitHub Actions, Cloud Build, or equivalent):

```
1. Checkout code
2. Install Node.js (22.x)
3. npm ci
4. Build main-app:   APP=main-app PROJECT_VERSION=$TAG npm run build
5. Build admin-app:  APP=admin-app PROJECT_VERSION=$TAG npm run build
6. Build Docker images:
   - docker build --build-arg APP=main-app -t gcr.io/$PROJECT/wna-web-main:$TAG .
   - docker build --build-arg APP=admin-app -t gcr.io/$PROJECT/wna-web-admin:$TAG .
7. Push images to GCR/Artifact Registry
8. Update K8s deployments:
   - kubectl set image deployment/wna-web-main wna-web-main=gcr.io/$PROJECT/wna-web-main:$TAG
   - kubectl set image deployment/wna-web-admin wna-web-admin=gcr.io/$PROJECT/wna-web-admin:$TAG
9. Wait for rollout:
   - kubectl rollout status deployment/wna-web-main
   - kubectl rollout status deployment/wna-web-admin
```

### Tagging Strategy
- `latest` — latest build from main branch
- `v1.0.0` — release tags
- `sha-abc1234` — commit SHA for traceability

---

## 9. Environment Comparison

| Aspect | Dev | Prod |
|--------|-----|------|
| main-app domain | `dev.whatsnextaction.com` | `whatsnextaction.com` |
| admin-app domain | `admin-dev.whatsnextaction.com` | `admin.whatsnextaction.com` |
| API domain (main) | `https://api-dev.whatsnextaction.com` | `https://api.whatsnextaction.com` |
| Admin API | `https://admin-dev.whatsnextaction.com` | `https://admin.whatsnextaction.com` |
| Replicas | 1-2 | 2+ |
| Admin access restriction | IP allowlist | VPN + IP allowlist |
| Code obfuscation | Disabled | Enabled (`vite.core.js:9`) |
| Console output | Stripped (Terser) | Stripped (Terser) |
| List page size | 10 items | 50 items |

---

## 10. File Locations Summary

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (Node build + Nginx serve) |
| `nginx.conf` | SPA serving config with health check |
| `config/apps.js` | App definitions (root dir, port, build output dir) |
| `config/vite.core.js` | Shared Vite config factory (aliases, minification, proxy) |
| `vite.config.js` | Root Vite entry (loads env, selects app from `APP` env var) |
| `src/main-app/scripts/core/domains.js` | Runtime config (`API_DOMAIN`, `GOOGLE_CLIENT_ID`, `PAGE_SIZE`) |
| `package.json` | Dependencies, build scripts, Node engine requirement |
| `k8s/main-app/` | K8s manifests for main-app (suggested location) |
| `k8s/admin-app/` | K8s manifests for admin-app (suggested location) |