import path from 'path'
import { config } from 'dotenv'
import { defineConfig, env } from "prisma/config";

// Load .env from root directory
// In Docker: .env is at /app/.env, prisma.config.ts is at /app/prisma.config.ts
// On host: both are accessible from backend/ directory
const envPath = path.resolve(__dirname, '../.env')
const dockerEnvPath = path.resolve(__dirname, '.env')
const finalEnvPath = require('fs').existsSync(envPath) ? envPath : dockerEnvPath
config({ path: finalEnvPath, override: true })

// Use DATABASE_URL if available, otherwise provide a dummy value for prisma generate
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public'

export default defineConfig({
  schema: 'shared/prisma/schema.prisma',
  datasource: {
    url: databaseUrl
  }
});
