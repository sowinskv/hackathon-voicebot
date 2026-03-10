# Database Setup for Agent Console Dashboard

To ensure the agent console dashboard works correctly with all metrics, you need to apply the database migrations that add the necessary fields for enhanced metrics tracking.

## Step 1: Apply Database Migrations

Run the following commands to apply the database schema changes:

```bash
cd /home/mpachnik/hackathon-voicebot/database/
./apply_migrations.sh
```

This script will:
1. Add required columns to the `sessions` table:
   - `first_try_completion` (BOOLEAN)
   - `customer_extremely_angry` (BOOLEAN)
   - `legal_threat_detected` (BOOLEAN)

2. Add required columns to the `session_data` table:
   - `attempt_count` (INTEGER)
   - `completed_on_first_try` (BOOLEAN)

3. Update the `transcripts` table:
   - Add support for extended sentiment values ('extreme_anger')
   - Add `contains_legal_threat` column (BOOLEAN)

4. Add database triggers to automatically calculate these metrics:
   - Update `first_try_completion` flag when all form fields are completed on first try
   - Update `customer_extremely_angry` flag when extreme anger is detected in transcripts
   - Update `legal_threat_detected` flag when legal threats are detected in transcripts

## Step 2: Restart the API Service

After applying the migrations, restart the API gateway service:

```bash
docker restart callcenter-api
```

## Troubleshooting

If you see an error message on the dashboard about missing schema fields, it means the database migrations haven't been successfully applied. Check that:

1. The Docker containers are running:
   ```bash
   docker ps | grep callcenter
   ```

2. The PostgreSQL container is accessible:
   ```bash
   docker exec -it callcenter-db psql -U callcenter -d callcenter -c "SELECT 1;"
   ```

3. Try manually applying the migration SQL files:
   ```bash
   docker exec -i callcenter-db psql -U callcenter -d callcenter < database/migrations/001_add_metrics_fields.sql
   docker exec -i callcenter-db psql -U callcenter -d callcenter < database/migrations/002_add_metrics_triggers.sql
   docker exec -i callcenter-db psql -U callcenter -d callcenter < database/migrations/003_seed_metrics_data.sql
   ```

After resolving the database schema issues, the dashboard should display all metrics correctly.