# Single-image build for panels that only support one root Dockerfile
# (no docker-compose). Builds the React frontend, then serves it from the
# same FastAPI process that serves the API - one process, one port.
#
# Requires an external MongoDB - set MONGO_URL (and DB_NAME, JWT_SECRET_KEY,
# OPENAI_API_KEY, etc; see backend/.env.example) as environment variables on
# the panel. This app does not run its own database.
#
# For local development with separate backend/frontend containers, use
# docker-compose.yml (backend/Dockerfile + frontend/Dockerfile) instead.

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN yarn install
COPY frontend/ .
# Strip any local .env that rode along in the build context (e.g. a
# developer's machine) so it can't override the same-origin URL below.
RUN rm -f .env .env.local .env.development .env.development.local
# Same-origin deployment: frontend and API share one host/port, so use
# relative API paths instead of an absolute cross-origin URL.
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
# Strip any local .env that rode along in the build context - config must
# come from container env vars (docker run -e / the panel's Environment
# tab) only, never a file baked into the image.
RUN rm -f .env

# Code hardcodes absolute /app/uploads paths (chat, product files, tax certs, etc.)
RUN mkdir -p /app/uploads
COPY uploads/ /app/uploads/

COPY --from=frontend-build /app/frontend/build /app/frontend/build

EXPOSE 8001

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
