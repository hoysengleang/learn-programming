# Sequelize Migrations

Use migrations to control database schema changes. Keep `SEQUELIZE_SYNCHRONIZE=false` so the app does not auto-change tables on startup.

## Commands

Run all pending migrations:

```bash
npx sequelize-cli db:migrate --config sequelize.config.cjs --migrations-path src/database/migrations
npm run db:migrate
```

Check migration status:

```bash
npx sequelize-cli db:migrate:status --config sequelize.config.cjs --migrations-path src/database/migrations
npm run db:migrate:status
```

Undo the latest migration:

```bash
npx sequelize-cli db:migrate:undo --config sequelize.config.cjs --migrations-path src/database/migrations
npm run db:migrate:undo
```

Undo all migrations:

```bash
npm run db:migrate:undo:all
```

Create a new migration file:

```bash
npm run db:migration:create -- --name add-comments-table
```

Run against another environment:

```bash
npm run db:migrate -- --env production
```
