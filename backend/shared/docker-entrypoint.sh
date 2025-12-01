#!/bin/sh

# Set Prisma to use Node-API instead of WASM (workaround for Prisma 7 Docker Alpine issue)
export PRISMA_FORCE_NAPI=1

echo "=== Debugging Prisma Installation ==="
echo "Checking @prisma/client installation..."
ls -la /app/node_modules/@prisma/ || echo "@prisma directory not found"
echo ""
echo "Checking for .prisma directory..."
ls -la /app/node_modules/.prisma/ || echo ".prisma directory not found"
echo ""
echo "Checking shared workspace..."
ls -la /app/shared/node_modules/ || echo "No node_modules in shared"
echo ""
echo "Contents of /app:"
ls -la /app/
echo ""
echo "Attempting to generate Prisma Client from /app..."
cd /app && npx prisma generate --schema shared/prisma/schema.prisma || {
  echo "PRISMA GENERATE FAILED - Keeping container alive for debugging"
  sleep infinity
}

echo "Starting service from current working directory..."
exec npm start
