import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma configuration.
 *
 * Moved out of `package.json#prisma`, which Prisma 6 deprecates and Prisma 7
 * removes — it printed a warning on every command.
 *
 * `dotenv/config` at the top is load-bearing: a config file takes over
 * environment loading from the CLI, and without it `DATABASE_URL` is simply
 * undefined and every command fails claiming the datasource is not set.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
