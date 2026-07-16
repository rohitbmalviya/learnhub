// ============================================================
// LearnHub — Prisma Client Singleton
//
// Prisma 7 requires a driver adapter; it no longer ships a
// bundled Rust query engine.
//
// We use @prisma/adapter-pg (node-postgres) against PostgreSQL —
// e.g. a Neon database. DATABASE_URL must be a postgres://
// connection string; on serverless platforms use the pooled
// (-pooler) Neon connection string.
//
// The global-instance pattern prevents hot-reload in Next.js
// development from opening a new connection pool on every save.
//
// Import path for all other modules:
//   import { db } from '@/lib/db'
// ============================================================

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

// Extend globalThis so the TypeScript narrowing is preserved and
// we don't open a second connection on every Next.js hot reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
