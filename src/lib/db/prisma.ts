import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// The Neon serverless driver talks over WebSocket. Outside a browser (i.e. in
// Vercel's Node.js serverless functions) there's no reliable global
// WebSocket, so without this the driver fails with an unhelpful bare
// `ErrorEvent` and no real message.
neonConfig.webSocketConstructor = ws;

// Standard Next.js dev-mode singleton: hot reload re-executes this module,
// so without caching on `global` each reload would open a fresh pool of
// connections to Neon until they're exhausted.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
