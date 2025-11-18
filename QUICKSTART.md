# 🚀 MapPaletteV2 - 5 Minute Quick Start

## Step 1: Prerequisites Check

Make sure you have:
- ✅ Docker & Docker Compose installed
- ✅ 10GB free disk space
- ✅ Ports 3000, 5432, 6379, 8000 available

## Step 2: Setup (One Command!)

```bash
./setup.sh
```

This will take 5-10 minutes and will:
1. Install dependencies
2. Generate Prisma client
3. Create database
4. Build Docker images
5. Start all services

## Step 3: Access

Once setup is complete, you can access:

- **App**: http://localhost:3000
- **API**: http://localhost:8080/api
- **Database UI**: http://localhost:8000

## Step 4: Create First User

Visit http://localhost:8000/auth/signup or use curl:

```bash
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123456"}'
```

## Step 5: Start Using!

You're done! 🎉

Open http://localhost:3000 and start creating routes.

---

## Useful Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart
docker compose restart

# Database console
docker compose exec supabase-db psql -U postgres postgres
```

---

## Troubleshooting

**Services won't start?**
```bash
docker compose down -v
./setup.sh
```

**Port already in use?**
```bash
# Check what's using the port
netstat -tulpn | grep 3000

# Kill the process or change port in .env
```

**Need more help?**
See [README.md](./README.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)

---

That's it! You now have a fully functional social media platform running locally. 🚀
