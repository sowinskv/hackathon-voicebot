#!/bin/bash

# Script to seed mock sessions data into the database

echo "Seeding mock sessions data into the database..."

# Use the environment variable for password if available, or use the default
DB_PASSWORD=${DB_PASSWORD:-devpassword123}

# Connect to the PostgreSQL database and execute the SQL script
# Using port 5433 as specified in the docker-compose.yml
PGPASSWORD="$DB_PASSWORD" psql -h localhost -p 5433 -U callcenter -d callcenter -f ./seeds/mock_sessions.sql

if [ $? -eq 0 ]; then
  echo "✅ Mock sessions data successfully added to the database!"
  echo "You should now see 5 example sessions in your agent console dashboard."
else
  echo "❌ Error adding mock sessions data to the database."
  echo "Please check your database connection settings."
fi