#!/bin/bash

# Script to apply migrations to a running database container

echo "Applying migrations to database..."

# Set database connection parameters
DB_USER="callcenter"
DB_NAME="callcenter"
DB_PORT="5433"
DB_HOST="localhost"
DB_PASSWORD=${DB_PASSWORD:-devpassword123}

# Find all migration files and sort them
migrations=($(find ./migrations -name "*.sql" | sort))

if [ ${#migrations[@]} -eq 0 ]; then
  echo "No migration files found."
  exit 1
fi

echo "Found ${#migrations[@]} migrations to apply."

# Apply each migration using docker exec
for migration in "${migrations[@]}"; do
  echo "Applying migration: $migration"

  # Copy the migration file to the PostgreSQL container
  docker cp "$migration" callcenter-db:/tmp/migration.sql

  # Run the migration inside the container
  docker exec -e PGPASSWORD="$DB_PASSWORD" callcenter-db psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migration.sql

  if [ $? -ne 0 ]; then
    echo "❌ Error applying migration: $migration"
  else
    echo "✅ Successfully applied migration: $migration"
  fi
done

echo "Migration process completed."
echo ""
echo "You may need to restart the API gateway for changes to take effect:"
echo "docker restart callcenter-api"