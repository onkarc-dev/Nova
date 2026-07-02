# Nova Infrastructure

## Startup flow

1. `src/main.ts` creates the Nest application.
2. `ConfigModule` validates environment variables with the Zod schema in `src/config/environment.ts`.
3. Middleware attaches a request ID and logs request completion metadata.
4. Security middleware configures Helmet, CORS, compression, cookies, and trust-proxy support.
5. Global validation, exception filtering, response wrapping, API prefixing, versioning, and graceful shutdown hooks are enabled.

## Configuration modules

Configuration is split by concern:

- App: API prefix, version, URLs, CORS, proxy, logging, port.
- Database: Prisma URLs and query logging behavior.
- JWT: access and refresh token secrets and expirations.
- Redis: Redis URL.
- Email: sender and SMTP URL.
- Payment: Stripe and Razorpay settings.
- Storage: local, S3, or Cloudinary storage settings.

## Persistence

`PrismaService` owns database connection lifecycle, query/error/warn logging, health checks, and transaction helpers. Migrations are managed through Prisma scripts in `package.json`.

## Redis

`RedisService` owns Redis connection lifecycle and health checks. `CacheService` provides JSON-safe get, set, and delete operations with explicit TTLs.

## Docker

- `Dockerfile` builds dependencies, generates Prisma client, compiles the application, and runs as a non-root user.
- `docker-compose.yml` defines PostgreSQL, Redis, API networking, volumes, and health checks.
- `docker-compose.dev.yml` adds source mounts and the development command.
- `docker-compose.prod.yml` adds restart policies and production environment defaults.
