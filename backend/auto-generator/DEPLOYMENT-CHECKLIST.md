# Deployment Checklist

Use this checklist to deploy the Auto-Generator Service.

## Pre-Deployment

### 1. Prerequisites
- [ ] Node.js 20+ installed
- [ ] PostgreSQL 15+ database available
- [ ] Google Gemini API key obtained
- [ ] Azure OpenAI API key and endpoint configured
- [ ] Docker installed (for container deployment)

### 2. Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Set `DATABASE_URL` to your PostgreSQL connection string
- [ ] Set `GEMINI_API_KEY` with your Google API key
- [ ] Set `AZURE_WHISPER_ENDPOINT` with your Azure endpoint
- [ ] Set `AZURE_WHISPER_API_KEY` with your Azure API key
- [ ] Set `PORT` (default: 3003)
- [ ] Set `NODE_ENV` to `production`

### 3. Database Setup
- [ ] Database `voicebot` exists (or create it)
- [ ] Run `database.sql` to create tables
- [ ] Verify all tables created successfully
- [ ] Grant appropriate permissions to database user
- [ ] Test database connection

### 4. Dependencies
- [ ] Run `npm install` to install packages
- [ ] Verify no security vulnerabilities: `npm audit`
- [ ] Update packages if needed: `npm update`

## Deployment Options

### Option A: Docker Deployment (Recommended)

#### Build
- [ ] Review and customize `Dockerfile` if needed
- [ ] Build image: `docker build -t auto-generator .`
- [ ] Test image locally: `docker run -p 3003:3003 --env-file .env auto-generator`
- [ ] Verify health endpoint: `curl http://localhost:3003/health`

#### Deploy
- [ ] Push image to registry (if using)
- [ ] Deploy container to production
- [ ] Configure persistent storage for `/tmp/uploads`
- [ ] Set up container restart policy
- [ ] Configure logging and monitoring

### Option B: Docker Compose Deployment

#### Setup
- [ ] Copy `docker-compose.example.yml` to your main `docker-compose.yml`
- [ ] Customize service configuration
- [ ] Add to existing network if needed
- [ ] Configure volumes for uploads

#### Deploy
- [ ] Run `docker-compose up -d auto-generator`
- [ ] Check logs: `docker-compose logs -f auto-generator`
- [ ] Verify health: `curl http://localhost:3003/health`

### Option C: Node.js Deployment

#### Build
- [ ] Run `npm run build` to compile TypeScript
- [ ] Verify `dist/` directory created
- [ ] Test build: `node dist/index.js`

#### Deploy
- [ ] Install production dependencies only: `npm ci --only=production`
- [ ] Use process manager (PM2, systemd, etc.)
- [ ] Configure auto-restart
- [ ] Set up log rotation

Example PM2:
```bash
pm2 start dist/index.js --name auto-generator
pm2 save
pm2 startup
```

## Post-Deployment

### 1. Smoke Tests
- [ ] Health check: `GET /health` returns 200
- [ ] Upload test transcript: `POST /api/upload/transcript`
- [ ] Run analysis: `POST /api/generate/analyze/:id`
- [ ] Test wizard: `POST /api/generate/wizard/:id`
- [ ] Verify database records created

### 2. Integration Tests
- [ ] Upload audio file (if Azure Whisper configured)
- [ ] Test transcription endpoint
- [ ] Generate flow diagram
- [ ] Generate system prompt
- [ ] Test improvements endpoint

### 3. Monitoring Setup
- [ ] Configure application logging
- [ ] Set up log aggregation (optional)
- [ ] Monitor CPU and memory usage
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors
- [ ] Track API response times

### 4. Security
- [ ] Environment variables not exposed
- [ ] API keys stored securely
- [ ] Database credentials encrypted
- [ ] HTTPS enabled (if public-facing)
- [ ] Rate limiting configured (if needed)
- [ ] Input validation working
- [ ] File size limits enforced

### 5. Performance
- [ ] Database connection pool working
- [ ] Response times acceptable
- [ ] Memory usage stable
- [ ] No memory leaks detected
- [ ] Concurrent request handling working

## Testing Endpoints

### Quick Health Check
```bash
curl http://localhost:3003/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "auto-generator",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### Test Transcript Upload
```bash
curl -X POST http://localhost:3003/api/upload/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript text",
    "description": "Deployment test"
  }'
```

Expected response:
```json
{
  "success": true,
  "transcriptId": 1,
  "transcript": "Test transcript text",
  "createdAt": "..."
}
```

### Test Full Wizard
```bash
# Use the transcriptId from previous response
curl -X POST http://localhost:3003/api/generate/wizard/1 \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Bot",
    "optimize": true
  }'
```

Expected: Large JSON response with pattern, flow, prompt, etc.

## Rollback Plan

If deployment fails:

### Docker
1. Stop new container: `docker stop auto-generator`
2. Start previous version: `docker start auto-generator-old`
3. Verify health endpoint
4. Investigate logs: `docker logs auto-generator`

### Node.js
1. Stop current process: `pm2 stop auto-generator`
2. Restore previous code: `git checkout previous-tag`
3. Rebuild: `npm run build`
4. Restart: `pm2 restart auto-generator`

### Database
1. If schema changed, restore backup:
   ```bash
   psql -U postgres -d voicebot < backup.sql
   ```

## Common Issues

### Port Already in Use
- Change `PORT` in `.env`
- Kill process using port: `lsof -ti:3003 | xargs kill -9`

### Database Connection Failed
- Verify `DATABASE_URL` format
- Check database is running: `pg_isready`
- Test connection: `psql $DATABASE_URL`
- Verify user permissions

### Gemini API Errors
- Verify API key is valid
- Check API quota: https://makersuite.google.com/
- Ensure correct model access (gemini-1.5-pro)

### Azure Whisper Errors
- Verify endpoint URL format
- Check API key validity
- Ensure deployment name matches
- Verify API version in URL

### File Upload Errors
- Check `/tmp/uploads` directory exists
- Verify write permissions
- Ensure sufficient disk space
- Check file size limits (25MB)

### Memory Issues
- Increase Node.js heap: `NODE_OPTIONS=--max-old-space-size=4096`
- Reduce concurrent requests
- Optimize database queries
- Review connection pool settings

## Monitoring Queries

### Check Recent Transcripts
```sql
SELECT id, description, created_at
FROM transcripts
ORDER BY created_at DESC
LIMIT 10;
```

### Check Generation Activity
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as count
FROM generated_flows
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Check Error Frequency
```sql
SELECT
  error_type,
  COUNT(*) as count
FROM conversation_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC;
```

## Maintenance Tasks

### Daily
- [ ] Check service health
- [ ] Review error logs
- [ ] Monitor disk usage

### Weekly
- [ ] Review API usage and costs
- [ ] Check database size
- [ ] Clean old transcripts (if needed)
- [ ] Review improvement suggestions

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize database queries
- [ ] Analyze performance metrics
- [ ] Update documentation

## Success Criteria

Deployment is successful when:
- ✅ Health endpoint returns 200
- ✅ Can upload and transcribe text
- ✅ Can generate flow diagrams
- ✅ Can generate system prompts
- ✅ Database queries working
- ✅ No errors in logs
- ✅ Response times < 2 minutes for wizard
- ✅ Memory usage stable
- ✅ CPU usage acceptable

## Support Contacts

- **API Issues**: Check documentation
- **Database Issues**: Review connection logs
- **AI Model Issues**: Check API provider status
- **General**: See README.md and QUICKSTART.md

## Documentation Links

- Full API Docs: `README.md`
- Quick Start: `QUICKSTART.md`
- Service Overview: `SERVICE-OVERVIEW.md`
- Example Scripts: `example-usage.sh`, `test-audio-upload.sh`
- Postman Collection: `postman-collection.json`

---

**Last Updated**: 2026-03-10
**Version**: 1.0.0
