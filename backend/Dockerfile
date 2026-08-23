FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Build deps for cryptography/bcrypt/pillow/jq wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libjq-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

# Code hardcodes absolute /app/uploads paths (chat, product files, tax certs, etc.)
RUN mkdir -p /app/uploads
COPY uploads/ /app/uploads/

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
