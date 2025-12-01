const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client with Connection Pooling
 *
 * Connection pool settings:
 * - connection_limit: Max connections per instance (default: num_cpus * 2 + 1)
 * - pool_timeout: How long to wait for available connection (default: 10s)
 *
 * Environment variables for connection pooling (add to DATABASE_URL):
 * - connection_limit=10 (recommended for microservices)
 * - pool_timeout=10 (seconds)
 * - connect_timeout=5 (seconds)
 */
const prismaClientSingleton = () => {
  // Prisma 7 requires adapter for standard PostgreSQL connections
  const { PrismaPg } = require('@prisma/adapter-pg');

  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

const globalForPrisma = global;
const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Graceful disconnect on process termination
process.on('beforeExit', async () => {
  await db.$disconnect();
});

module.exports = { db };
