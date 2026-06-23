import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations require a direct Postgres connection (port 5432), not the pooler (6543)
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
