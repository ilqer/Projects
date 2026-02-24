#!/bin/bash
# Fix Flyway migration history after renaming migrations
# This script updates the migration history to match the new migration numbers

echo "Fixing Flyway migration history..."

# Check if database is running
if ! docker ps | grep -q "artifact-comparator-db"; then
    echo "Database container is not running. Starting it..."
    docker-compose up -d postgres
    sleep 5
fi

# Get current migration history
echo "Current migration history:"
docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;"

# Delete old migration history (V0, V1, V2)
echo ""
echo "Deleting old migration history..."
docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "DELETE FROM flyway_schema_history WHERE version IN ('0', '1', '2');"

# Check if users table exists
USERS_EXISTS=$(docker exec artifact-comparator-db psql -U admin -d artifact_comparator -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" | tr -d ' ')

if [ "$USERS_EXISTS" = "t" ]; then
    echo "Users table exists. Marking V1 as applied..."
    docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) VALUES (1, '1', 'create users table', 'SQL', 'V1__create_users_table.sql', NULL, 'admin', NOW(), 0, true);"
fi

# Check questionnaires table
QUESTIONNAIRES_EXISTS=$(docker exec artifact-comparator-db psql -U admin -d artifact_comparator -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questionnaires');" | tr -d ' ')

if [ "$QUESTIONNAIRES_EXISTS" = "t" ]; then
    echo "Questionnaires table exists. Marking V2 as applied..."
    docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) VALUES (2, '2', 'create questionnaire tables', 'SQL', 'V2__create_questionnaire_tables.sql', NULL, 'admin', NOW(), 0, true);"
fi

# Check if scoring columns exist
SCORING_EXISTS=$(docker exec artifact-comparator-db psql -U admin -d artifact_comparator -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questionnaires' AND column_name = 'passing_threshold');" | tr -d ' ')

if [ "$SCORING_EXISTS" = "t" ]; then
    echo "Scoring configuration exists. Marking V3 as applied..."
    docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) VALUES (3, '3', 'add scoring configuration', 'SQL', 'V3__add_scoring_configuration.sql', NULL, 'admin', NOW(), 0, true);"
fi

echo ""
echo "Updated migration history:"
docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;"

echo ""
echo "Migration history fixed! Restart backend now."
echo "Run: docker-compose restart backend"

