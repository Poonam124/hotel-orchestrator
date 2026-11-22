# Hotel Offer Orchestrator

Aggregates overlapping hotel offers from two mock suppliers, dedupes by hotel name, keeps the
cheapest offer, stores the result in Redis and filters by price inside Redis.
Includes login (JWT), an interactive React UI and failure simulation for the suppliers.

Stack: Node.js (TypeScript), Express, Temporal, Redis, React (Vite), Docker Compose

## Structure
```
backend/    Express API, auth, mock suppliers, Temporal workflow/worker, Redis, tests
frontend/   React + Vite UI (nginx in Docker)
postman/    Postman collection
docker-compose.yml
.env.example   (JWT_SECRET for Docker)
```

## How it works
1. `GET /api/hotels?city=delhi` starts the Temporal `hotelOfferWorkflow`.
2. Supplier A and B activities run in parallel (3 retries each). If one fails, the other is still used.
   If both fail the API returns 502.
3. Offers are deduped by normalized name; the cheaper price wins.
4. Result is saved in Redis (Sorted Set `hotels:<city>`, score = price, TTL 5 min).
5. With `minPrice` / `maxPrice`, the filter runs in Redis (`ZRANGEBYSCORE`).

## Authentication
- `POST /auth/register` and `POST /auth/login` return `{ token, user }` (JWT, default 8h).
- Send it as `Authorization: Bearer <token>`.
- Passwords are hashed with bcrypt. Users are stored in Redis (`users:<email>`).
- Login needed: `/api/hotels/search` (UI endpoint) and `/admin/*` (supplier controls).
- Public: `/api/hotels` (assignment endpoint), `/health`, `/live`, `/auth/*`, mock supplier routes.
- To lock `/api/hotels` too, add `requireAuth` to that route in `backend/src/routes/hotels.ts`.
- Set `JWT_SECRET` (min 16 chars). In production the server refuses to start with the dev default.

## Run with Docker
    copy .env.example .env      (then edit JWT_SECRET)
    docker compose up --build

Frontend http://localhost:5173 | API http://localhost:3000 | Temporal UI http://localhost:8080

Open the frontend, create an account, and you are in.
Redis uses a volume, so accounts survive restarts (`docker compose down -v` removes them).

## Run locally
    docker compose up -d postgres temporal temporal-ui redis

    cd backend
    npm install
    npm run dev:worker      (terminal 1)
    npm run dev:api         (terminal 2)

    cd frontend
    npm install
    npm run dev             (terminal 3)  -> http://localhost:5173

Tests (no Redis/Temporal needed): `cd backend && npm test`

## API
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | no | Create account, returns token |
| POST | /auth/login | no | Returns token |
| GET | /auth/me | yes | Current user |
| GET | /api/hotels?city= | no | Best-price list via Temporal (plain array) |
| GET | /api/hotels?city=&minPrice=&maxPrice= | no | Price filter inside Redis |
| GET | /api/hotels/search | yes | UI endpoint: sort, limit, offset, refresh, meta |
| GET | /supplierA/hotels, /supplierB/hotels | no | Mock suppliers |
| GET / PUT / POST | /admin/suppliers, /admin/suppliers/:A\|B, /admin/suppliers/reset | yes | Failure simulation |
| GET | /health | no | Suppliers, Redis, Temporal status |
| GET | /live | no | Liveness |

## Postman
Import `postman/hotel-offer-orchestrator.postman_collection.json`.
Run **Register (once)**, then **Login (saves token)**, then the rest. The token is stored in the
collection variable `token` and sent automatically.

## Where to change what
| I want to... | Edit |
|---|---|
| Change dedupe / tie-break rule | backend/src/domain/dedupe.ts |
| Change mock hotels | backend/src/suppliers/data.ts |
| Change retries / timeouts | backend/src/temporal/workflows.ts |
| Change Redis keys / filtering | backend/src/lib/redis.ts |
| Protect / unprotect a route | backend/src/routes/*.ts, backend/src/app.ts |
| Change password rules | backend/src/routes/schemas.ts |
| Change token lifetime | JWT_EXPIRES_IN in backend/.env |
| Change cities, price range | frontend/src/lib/constants.ts |
| Change look | frontend/src/styles.css |
