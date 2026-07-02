# Local development

Nova uses NestJS, Prisma, PostgreSQL, and Redis.

## Windows quick start

Run commands from the project folder, not from `C:\Users\Admin`.

```cmd
cd C:\Users\Admin\Nova
copy .env.example .env
npm install
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d postgres redis
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run start:dev
```

Open:

```text
http://localhost:4000/api/v1/health
```

## Port notes

The local compose override maps Nova PostgreSQL to Windows port 5433 so it does not conflict with other local PostgreSQL projects using 5432.

The default local database URLs are:

```env
DATABASE_URL="postgresql://nova:nova@localhost:5433/nova?schema=public"
DIRECT_URL="postgresql://nova:nova@localhost:5433/nova?schema=public"
```
