FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# System deps if needed (psycopg[binary] avoids build deps)
RUN pip install --no-cache-dir --upgrade pip

# Install runtime deps directly to avoid packaging pitfalls
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    "pydantic>=2" \
    "sqlalchemy>=2" \
    "psycopg[binary]>=3.1" \
    alembic \
    "passlib[bcrypt]" \
    pyjwt \
    python-multipart

# Copy app code
COPY app ./app
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

# Default command is set in docker-compose (reload etc.)
