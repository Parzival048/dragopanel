import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Extend the global object type to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get database URL from environment
const connectionString = process.env.DATABASE_URL

// Create Prisma client with PostgreSQL adapter (required for Prisma 7)
function createPrismaClient(): PrismaClient {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Use connection pooling for serverless environments
  const pool = new Pool({
    connectionString,
    max: 10, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Use existing client in development to prevent too many connections
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
