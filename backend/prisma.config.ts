import path from 'path'
import { config } from 'dotenv'
import { defineConfig } from "prisma/config";

// Store env var before loading .env file (if set externally)
const externalDatabaseUrl = process.env.DATABASE_URL;

// Load .env from root directory
// In Docker: .env is at /app/.env, prisma.config.ts is at /app/prisma.config.ts
// On host: both are accessible from backend/ directory
const envPath = path.resolve(__dirname, '../.env')
const dockerEnvPath = path.resolve(__dirname, '.env')
const finalEnvPath = require('fs').existsSync(envPath) ? envPath : dockerEnvPath
config({ path: finalEnvPath })

// Prioritize externally set DATABASE_URL over .env file
const databaseUrl = externalDatabaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:ypnnht8749@supabase-db:5432/postgres?schema=public'

export default defineConfig({
  schema: 'shared/prisma/schema.prisma',
  datasource: {
    url: databaseUrl
  }
});
