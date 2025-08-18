up:
\tdocker compose up -d --build

down:
\tdocker compose down -v

logs:
\tdocker compose logs -f --tail=200

migrate:
\tdocker compose run --rm api alembic upgrade head

revision:
\tdocker compose run --rm api alembic revision -m "$(m)" --autogenerate
