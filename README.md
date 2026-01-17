# Synapse Auth Service

Authentication and account management microservice built with Express and Prisma. Provides JWT-based authentication, email verification, password reset flows, admin endpoints, health checks, and integrations with PostgreSQL, Redis (BullMQ), and RabbitMQ.

- Runtime: Node.js 20, Express 5
- Auth: RS256 access tokens (JWT), HS256 refresh tokens
- DB: PostgreSQL + Prisma
- Infra: Redis, RabbitMQ
- Security: Helmet, CORS, httpOnly cookies, JWKS exposure

## Features

- Authentication: register, login, refresh, logout, `getMe`, change password
- Verification: email codes; password reset with code → reset token → new password
- Admin: accounts listing, logs, status updates, summaries over time
- JWKS: public key at `/api/auth/jwks.json` for RS256 verification
- Health: `/health` with DB check and runtime info

## Architecture

- App: [app.js](app.js) with middleware, CORS, routes, and error handling
- Bootstrap: [server.js](server.js) initializes RabbitMQ, Prisma, and starts server
- Routes: [routes](routes) for `auth` and `admin`
- Controllers: [controllers](controllers) request handling
- Services: [services](services) business logic
- Config: [config](config) for Prisma, Redis, RabbitMQ
- ORM: [prisma/schema.prisma](prisma/schema.prisma) models and enums
- Utils: [utils/jwt.js](utils/jwt.js), [utils/jwks.js](utils/jwks.js)

## Prerequisites

- Node.js 20+
- PostgreSQL
- Redis
- RabbitMQ
- RSA key pair (PEM files) for RS256 JWT
- Windows notes: use Git Bash or WSL for `openssl`, or install OpenSSL on Windows

## Setup

1. Create `.env` from example  
   Copy [.env.example](.env.example) → `.env` and adjust values.

2. Generate RSA keys (preferred via OpenSSL)

- Git Bash/WSL/macOS/Linux:
  ```bash
  mkdir -p keys
  openssl genrsa -out keys/private.pem 2048
  openssl rsa -in keys/private.pem -pubout -out keys/public.pem
  ```
- Windows PowerShell (if OpenSSL is installed and on PATH):
  ```powershell
  New-Item -ItemType Directory -Force -Path keys | Out-Null
  openssl genrsa -out keys\private.pem 2048
  openssl rsa -in keys\private.pem -pubout -out keys\public.pem
  ```

3. Install dependencies and prepare DB

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## Environment Variables

See [.env.example](.env.example). Important keys:

- `PORT`: HTTP port (example `4000`; server defaults to `5000` if unset)
- `NODE_ENV`: `development` or `production`
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_PRIVATE_KEY_PATH`: path to `keys/private.pem`
- `JWT_PUBLIC_KEY_PATH`: path to `keys/public.pem`
- `JWT_EXPIRES_IN`: access token TTL (e.g., `15m`)
- `REFRESH_TOKEN_SECRET`: HS256 secret for refresh tokens
- `REFRESH_TOKEN_EXPIRES_IN`: e.g., `7d`
- `REDIS_URL`: `redis://localhost:6379`
- `RABBITMQ_URL`: `amqp://guest:guest@localhost:5672`
- `SERVICE_NAME`: service identifier
- `USER_SERVICE_URL`: base URL for external user service

## Running

- Development (nodemon):
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm start
  ```
- Default port: `PORT` from `.env`. Health at `/health`.

## Docker

- Production image ([Dockerfile](Dockerfile)):
  ```bash
  docker build -t synapse-auth-service:prod .
  docker run --env-file .env -p 4000:4000 synapse-auth-service:prod
  ```
- Dev image ([Dockerfile.dev](Dockerfile.dev)):
  ```bash
  docker build -f Dockerfile.dev -t synapse-auth-service:dev .
  docker run --env-file .env -p 4000:4000 synapse-auth-service:dev
  ```
  Dev image runs `prisma generate`, `migrate deploy`, and `db seed` automatically.

## API

Base path: `/api/auth` ([routes/auth.routes.js](routes/auth.routes.js))

- Public:
  - `GET /api/auth/` → hello world
  - `GET /api/auth/jwks.json` → JWKS (see [utils/jwks.js](utils/jwks.js))
  - `POST /api/auth/register` → body: `email, password, username, firstName, lastName, gender`
  - `POST /api/auth/resend-verification` → body: `email`
  - `POST /api/auth/verify-email` → body: `email, code`
  - `POST /api/auth/login` → body: `email, password` → sets `accessToken` and `refreshToken` cookies
  - `POST /api/auth/refresh` → reads `refreshToken` cookie; rotates tokens
  - `POST /api/auth/request-password-reset` → body: `email`
  - `POST /api/auth/verify-reset-code` → body: `email, code` → sets `resetToken` cookie
  - `POST /api/auth/set-new-password` → body: `newPassword` + `resetToken` cookie
- Authenticated (Bearer or `accessToken` cookie):
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `POST /api/auth/change-password` → body: `currentPassword, newPassword`
- Admin (base: `/api/auth/admin`, requires `SYSTEM_ADMIN` role; [routes/admin.routes.js](routes/admin.routes.js)):
  - `GET /accounts` → query: `page, limit, q`
  - `GET /accounts/:id/logs` → query: `cursorId, cursorCreatedAt, limit`
  - `PATCH /accounts/:id` → body: `status`
  - `GET /accounts/summary`
  - `GET /accounts/summary-over-time` → query: `startDate, endDate`

### Quick curl examples

```bash
# Health
curl http://localhost:4000/health

# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"P@ssw0rd!","username":"user1","firstName":"User","lastName":"Example","gender":"MALE"}'

# Login (stores cookies if curl supports cookie jar; otherwise inspect JSON)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"P@ssw0rd!"}'

# Get Me (with Bearer token)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Authentication Details

- Access tokens: RS256 signed with private key ([utils/jwt.js](utils/jwt.js)); verified with public key exposed via JWKS ([utils/jwks.js](utils/jwks.js)).
- Refresh tokens: HS256 signed via `REFRESH_TOKEN_SECRET`; include `jti` and are revocable.
- Cookies: `httpOnly`, `sameSite=strict`, and `secure` in production.

## Health & CORS

- Health: `GET /health` checks PostgreSQL and returns uptime, memory, hostname, timestamp.
- CORS origins in [app.js](app.js): `http://localhost:3000`, `http://localhost:3001`, and an AWS ALB. Credentials enabled and common headers/methods allowed.

## Jobs & Queues (BullMQ)

- Redis connection: [config/redis.js](config/redis.js)
- Queue: [jobs/queues/userSummary.queue.js](jobs/queues/userSummary.queue.js)
- Scheduler: [jobs/schedulers/userSummary.scheduler.js](jobs/schedulers/userSummary.scheduler.js)
- Worker: [jobs/workers/userSummary.worker.js](jobs/workers/userSummary.worker.js)

Run:

```bash
npm run start:worker
npm run start:scheduler
# or both
npm run start:bullmq
```

## Events (RabbitMQ)

- Channel: [config/rabbitmq.js](config/rabbitmq.js) with reconnect logic
- Consumer bootstrap: [server.js](server.js)
- Consumers: [events/consumers/user.consumer.js](events/consumers/user.consumer.js)
- Publishers: [events/publishers](events/publishers)

## Database Schema (Prisma)

Models in [prisma/schema.prisma](prisma/schema.prisma):

- `Account`, `VerificationCode`, `VerificationToken`, `RefreshToken`
- `AccountLog` for action logging
- `UserSummary` for daily metrics
- Enums: `AccountRole`, `AccountStatus`, `CodePurpose`, `LogAction`

## NPM Scripts

- `dev`: start with nodemon
- `start`: start HTTP server
- `db:reset`: `prisma migrate reset --force` (destructive)
- `start:worker`: BullMQ worker
- `start:scheduler`: BullMQ scheduler
- `start:bullmq`: worker + scheduler

## Security Notes

- Keep `REFRESH_TOKEN_SECRET` strong and private
- Use HTTPS in production (`secure` cookies)
- Limit CORS to trusted origins
- Rotate JWT keys and secrets periodically
