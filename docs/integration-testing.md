# Integration Testing

Phase 1 database-backed integration tests are opt-in so regular unit test runs
never touch a developer, staging, or production database by accident.

## Requirements

- PostgreSQL database dedicated to tests.
- `TEST_DATABASE_URL` pointing at that database.
- Never point `TEST_DATABASE_URL` at production or shared staging data.

Example local URL:

```text
postgresql://nova:nova_password@localhost:5432/nova_commerce_test?schema=public
```

## Prepare The Test Database

Create the database, then apply migrations with the test URL:

```powershell
$env:TEST_DATABASE_URL="postgresql://nova:nova_password@localhost:5432/nova_commerce_test?schema=public"
$env:DATABASE_URL=$env:TEST_DATABASE_URL
$env:DIRECT_URL=$env:TEST_DATABASE_URL
npm.cmd run db:generate
node --env-file=.env.example ./node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma
```

## Run Tests

With `TEST_DATABASE_URL` unset, integration specs are skipped and unit tests run
normally:

```powershell
npm.cmd run test
```

With `TEST_DATABASE_URL` set, the Phase 1 integration spec starts the Nest app
on an ephemeral local port and exercises real HTTP routes against the test
database:

```powershell
$env:TEST_DATABASE_URL="postgresql://nova:nova_password@localhost:5432/nova_commerce_test?schema=public"
npm.cmd run test
```

The integration spec creates unique test users per run and removes those users,
addresses, refresh tokens, seller applications, and stores during teardown.
