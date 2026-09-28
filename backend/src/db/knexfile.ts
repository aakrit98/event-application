import type { Knex } from "knex";
import { env } from "../config/env";

const config: Knex.Config = {
  client: "mysql2",
  connection: {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: "./migrations",
    extension: "ts",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./seeds",
    extension: "ts",
  },
};

export default config;