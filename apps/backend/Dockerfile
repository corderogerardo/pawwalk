FROM ghcr.io/astral-sh/uv:python3.10-bookworm-slim

WORKDIR /app
ENV UV_PROJECT_ENVIRONMENT=/app/.venv

# Cached layer: install deps before source is copied/mounted.
COPY pyproject.toml uv.lock ./
RUN uv sync --no-install-project

COPY . .

EXPOSE 8000
# Production server (no reload/debug). Render injects $PORT; default to 8000
# locally. Startup runs `alembic upgrade head` (app/db.py) so the schema —
# including the PostGIS bits on Neon — is applied on every deploy.
CMD uv run fastapi run app/main.py --host 0.0.0.0 --port ${PORT:-8000}
