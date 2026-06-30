FROM ghcr.io/astral-sh/uv:python3.10-bookworm-slim

WORKDIR /app
ENV UV_PROJECT_ENVIRONMENT=/app/.venv

# Cached layer: install deps before source is copied/mounted.
COPY pyproject.toml uv.lock ./
RUN uv sync --no-install-project

COPY . .

EXPOSE 8000
CMD ["uv", "run", "fastapi", "dev", "--host", "0.0.0.0"]
