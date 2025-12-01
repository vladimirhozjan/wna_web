#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <VERSION>"
  exit 1
fi

VERSION="$1"

PROJECT_ID="${PROJECT_ID:-wna-project}"
CLUSTER_NAME="${CLUSTER_NAME:-wna-cluster}"
AR_REPO="${AR_REPO:-wna-images}"
AR_REGION="${AR_REGION:-europe-central2}"
ZONE="${ZONE:-europe-central2-a}"

LOCAL_WEB_IMAGE="${LOCAL_WEB_IMAGE:-wna_web_main_app}"
DEPLOYMENT_WEB="${DEPLOYMENT_WEB:-web-main-app}"
CONTAINER_WEB="${CONTAINER_WEB:-web-main-app}"
NAMESPACE="${NAMESPACE:-wna-develop}"

DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.yml}"

AR_HOST="${AR_REGION}-docker.pkg.dev"
REMOTE_WEB_IMAGE="${AR_HOST}/${PROJECT_ID}/${AR_REPO}/${LOCAL_WEB_IMAGE}"

echo "==> Building frontend Docker image"
PROJECT_VERSION="${VERSION}" \
docker-compose -f "${DOCKER_COMPOSE_FILE}" build

echo "==> Authenticating GKE"
gcloud config set project "${PROJECT_ID}"
gcloud container clusters get-credentials "${CLUSTER_NAME}" --zone "${ZONE}"
gcloud auth configure-docker "${AR_HOST}" -q

echo "==> Tag & push"
docker tag "${LOCAL_WEB_IMAGE}:${VERSION}" "${REMOTE_WEB_IMAGE}:${VERSION}"
docker push "${REMOTE_WEB_IMAGE}:${VERSION}"

echo "==> Updating Kubernetes deployment"
kubectl set image \
  "deployment/${DEPLOYMENT_WEB}" \
  "${CONTAINER_WEB}=${REMOTE_WEB_IMAGE}:${VERSION}" \
  -n "${NAMESPACE}"

kubectl rollout status \
  "deployment/${DEPLOYMENT_WEB}" \
  -n "${NAMESPACE}"

echo "==> Frontend ${VERSION} deployed successfully."