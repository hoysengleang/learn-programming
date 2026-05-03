require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Sequelize migrations.');
}

const config = {
  dialect: 'postgres',
  url: databaseUrl,
  migrationStorageTableName: 'sequelize_meta',
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
