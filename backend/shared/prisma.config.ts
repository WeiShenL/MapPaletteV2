import path from 'path'
import { config } from 'dotenv'
import { defineConfig, env } from "prisma/config";

// Load .env from root directory (../../.env), overriding any existing env vars
config({ path: path.resolve(__dirname, '../../.env'), override: true })

// Use DATABASE_URL if available, otherwise provide a dummy value for prisma generate
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl
  }
});
