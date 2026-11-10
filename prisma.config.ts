import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js reads .env.local; load it for the Prisma CLI too (Prisma 7 does not auto-load env files).
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
