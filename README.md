# Destinations Microservice

The Destinations microservice provides CRUD APIs for managing cities and their seasonal metadata for the Travel Itinerary & Pricing Assistant platform.

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
mkdir -p data
```

### Running the Service

```bash
npm start
```

The service listens on port `3000` by default. Use the `PORT` environment variable to override it. A persistent SQLite database file is stored in `data/destinations.db` unless `DB_PATH` is provided.

For local development with auto-reload:

```bash
npm run dev
```

### Testing

```bash
npm test
```

The tests use an in-memory SQLite database and exercise core API flows.

## API Overview

All responses are JSON encoded. Error responses follow the shape `{ "errors": ["message"] }`.

### Health Check
- `GET /healthz` – returns `{ "status": "ok" }` when the service is ready.

### Cities

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/cities` | List all cities. |
| `GET` | `/cities/{id}` | Retrieve a single city by id. |
| `GET` | `/cities/{id}/seasons` | Return the seasons for a given city id. |
| `POST` | `/cities` | Create a city. Body fields: `name`, `country_code` (ISO alpha-2), `currency` (ISO 4217). |
| `PUT` | `/cities/{id}` | Update a city by identifier. |
| `DELETE` | `/cities/{id}` | Remove a city. Associated seasons are deleted automatically. |

Example request:

```bash
curl -X POST http://localhost:3000/cities \
  -H 'Content-Type: application/json' \
  -d '{"name":"Paris","country_code":"FR","currency":"EUR"}'
```

Example response:

```json
{
  "id": 1,
  "name": "Paris",
  "country_code": "FR",
  "currency": "EUR"
}
```

### Seasons

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/seasons` | List all seasons. Supports `?city_id=` filter. |
| `POST` | `/seasons` | Create a season. Body fields: `city_id`, `season_name` (`peak`, `shoulder`, `off`), `start_month`, `end_month`. |
| `PUT` | `/seasons/{id}` | Update a season by identifier. Optional `city_id` enables reassociation. |
| `DELETE` | `/seasons/{id}` | Remove a season. |

Example request:

```bash
curl -X POST http://localhost:3000/seasons \
  -H 'Content-Type: application/json' \
  -d '{"city_id":1,"season_name":"peak","start_month":6,"end_month":8}'
```

Example response:

```json
{
  "id": 1,
  "city_id": 1,
  "season_name": "peak",
  "start_month": 6,
  "end_month": 8
}
```

Foreign key constraints ensure that seasons always reference a valid city. Season names are unique per city.

## Configuration

Environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port to bind | `3000` |
| `DB_PATH` | Location of the SQLite database | `data/destinations.db` |

## Project Structure

```
src/
  app.js          # Express application setup
  server.js       # Entry point
  db/             # Database connection and schema bootstrap
  routes/         # Cities and seasons routers
```

Tests live under `test/` and use Node.js' built-in test runner.

## Integrating with Other Teams

- **Travel Pricing DB (Team 1)** — Use `GET /cities` and `GET /cities/{id}/seasons` to seed relational tables with canonical ids
  and avoid mismatched foreign keys when importing into MySQL.
- **Pricing microservice (Team 3)** — Reference the `currency` on `GET /cities/{id}` when constructing rate rows and call `/seaso
  ns?city_id=` for validation before persisting seasonal pricing data.
- **Itineraries microservice (Team 4)** — Power itinerary segment forms with `/cities` and fetch context aware hints via `/seaso
  ns?city_id=` to show collaborators available travel windows.

The service is storage-agnostic. To use Postgres/MySQL instead of SQLite, replace `src/db/index.js` with the appropriate driver
while keeping the exported interface. All routers operate on the injected `db` instance and require no further changes.
