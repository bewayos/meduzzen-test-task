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

lint-api:
\tcd api && ruff check . && mypy .

format-api:
\tcd api && ruff format . && black . && isort .

lint-web:
\tcd web && npx eslint "src/**/*.{ts,tsx}"

format-web:
\tcd web && npx prettier --write "src/**/*.{ts,tsx}"
