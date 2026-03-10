# 🐳 Docker Setup - FIXED AND WORKING

## ✅ All Issues Resolved!

The Docker Compose configuration is now **fully working** with a **single** `docker-compose.yml` file.

## 🐛 What Was Fixed

1. **Port Conflict**: Changed PostgreSQL from port 5432 → **5433**
2. **Package Error**: Fixed `@livekit/server-sdk` → `livekit-server-sdk` v2.15.0
3. **Single Configuration**: Merged into one `docker-compose.yml` (no more .dev file)
4. **Simplified Build**: Development-friendly Dockerfile configuration

## 🚀 Quick Start

### Option 1: Use the Script (Easiest)

```bash
./start-simple.sh
```

### Option 2: Manual Start

```bash
docker-compose up -d
```

That's it! Just one command.

## 📊 What Gets Started

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| PostgreSQL | callcenter-db | 5433 | Database |
| API Gateway | callcenter-api | 3000 | Backend API |
| Voice App | callcenter-voice-app | 5173 | Client UI |
| Bot Builder | callcenter-builder | 5174 | Admin UI |
| Agent Console | callcenter-console | 5175 | Consultant UI |

## ⏱️ First Startup Timeline

```
0-1 min:  ✅ Containers start
1-2 min:  ✅ PostgreSQL healthy, API responds
2-5 min:  ⏳ npm install runs (frontends)
5+ min:   🎯 All apps accessible!
```

**Be patient!** First start takes 3-5 minutes as npm packages install.

## 🔍 Monitor Progress

```bash
# View all logs
docker-compose logs -f

# Watch specific service
docker logs callcenter-voice-app -f

# Check status
docker-compose ps

# When you see "ready in XXX ms", it's ready!
```

## 📍 Access Points

Once started (after 5 minutes):

- **Voice App**: http://localhost:5173
- **Bot Builder**: http://localhost:5174
- **Agent Console**: http://localhost:5175
- **API Gateway**: http://localhost:3000
- **Database**: localhost:5433

## 📋 Common Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart specific service
docker-compose restart voice-app

# View logs
docker-compose logs -f

# Fresh start (remove volumes)
docker-compose down -v
docker-compose up -d

# Check health
curl http://localhost:3000/health
```

## ✅ Verification

After starting, verify everything is working:

```bash
# 1. Check all services running
docker-compose ps

# 2. Check API health
curl http://localhost:3000/health
# Should return: {"status":"ok",...}

# 3. Check database
docker exec callcenter-db psql -U callcenter -c "SELECT COUNT(*) FROM flows;"
# Should return: 2

# 4. Check frontends (after 5 min)
curl -I http://localhost:5173
curl -I http://localhost:5174
curl -I http://localhost:5175
# All should return HTTP 200
```

## 🔧 Troubleshooting

### Frontends not accessible

**Cause**: npm install still running
**Solution**: Wait 5 minutes, check logs:
```bash
docker logs callcenter-voice-app -f
# Wait for "ready in XXX ms"
```

### Port already in use

**Cause**: Another service using the port
**Solution**: Stop conflicting service or change port in docker-compose.yml

### Database connection errors

**Cause**: Database not ready yet
**Solution**: Wait 30 seconds, check:
```bash
docker-compose ps
# postgres should show "healthy"
```

### Need fresh start

**Solution**:
```bash
docker-compose down -v
docker-compose up -d
```

## 🎯 Configuration Files

**Single file setup:**
- `docker-compose.yml` - Main configuration (single file!)
- `.env` - Environment variables (your API keys)
- `start-simple.sh` - Quick start script

## ⚙️ Environment Variables

Configured in `.env`:

```bash
# Already configured ✅
ELEVENLABS_API_KEY=sk_555...
GEMINI_API_KEY=AIza...
AZURE_OPENAI_API_KEY=6gk6...

# You need to configure ⚠️
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

Get LiveKit credentials: https://cloud.livekit.io

## 📝 Important Notes

1. **Port 5433**: PostgreSQL is on 5433 (not 5432) to avoid conflicts
2. **First start is slow**: npm install takes 3-5 minutes
3. **Subsequent starts faster**: ~1 minute (packages cached)
4. **LiveKit required**: For voice features, configure in .env
5. **Docker volumes**: Data persists in `postgres_data` volume

## 🎉 Success!

When you see this, you're ready:

```bash
$ docker-compose ps

NAME                   STATUS
callcenter-api         Up
callcenter-builder     Up
callcenter-console     Up
callcenter-db          Up (healthy)
callcenter-voice-app   Up

$ curl http://localhost:3000/health
{"status":"ok",...}
```

Now you can:
1. ✅ Access all 3 web applications
2. 🔧 Configure LiveKit for voice
3. 🧪 Test the system
4. 🎤 Prepare your demo

---

**Status**: ✅ WORKING
**Configuration**: Single docker-compose.yml
**Services**: 5 containers
**Startup Time**: 3-5 minutes (first run), 1 min (subsequent)
