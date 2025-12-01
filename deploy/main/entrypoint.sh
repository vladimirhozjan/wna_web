#!/bin/sh

APP_DOMAIN="${APP_DOMAIN:-http://localhost:5173}"
API_DOMAIN="${API_DOMAIN:-http://localhost:8000}"

cat <<EOF > /usr/share/nginx/html/config.js
window.RUNTIME_CONFIG = {
  APP_DOMAIN: "${APP_DOMAIN}",
  API_DOMAIN: "${API_DOMAIN}"
};
EOF

exec "$@"