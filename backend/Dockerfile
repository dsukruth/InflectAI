FROM python:3.10-slim

WORKDIR /app

# System deps needed by snowflake-connector-python and cryptography
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libssl-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Create writable data dir for SQLite
RUN mkdir -p /tmp/data

ENV PORT=8080
EXPOSE $PORT

# Shell form so $PORT is expanded at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --log-level info
