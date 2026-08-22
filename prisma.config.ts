import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Migrate needs a direct (unpooled) connection; the app's runtime client
// (src/lib/db/prisma.ts) uses the pooled DATABASE_URL instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
