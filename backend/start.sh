#!/bin/sh
set -e
echo "Starting uvicorn on port ${PORT:-8080}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8080}" --log-level info
