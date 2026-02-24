# Fix Flyway migration history after renaming migrations
# This script updates the migration history to match the new migration numbers

Write-Host "Fixing Flyway migration history..." -ForegroundColor Yellow

# Check if database is running
$dbRunning = docker ps | Select-String "artifact-comparator-db"
if (-not $dbRunning) {
    Write-Host "Database container is not running. Starting it..." -ForegroundColor Yellow
    docker-compose up -d postgres
    Start-Sleep -Seconds 5
}

# Get current migration history
Write-Host "Current migration history:" -ForegroundColor Cyan
docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;"

# Delete old migration history (V0, V1, V2)
Write-Host "`nDeleting old migration history..." -ForegroundColor Yellow
docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "DELETE FROM flyway_schema_history WHERE version IN ('0', '1', '2');"

# If users table exists but migration history is wrong, we need to mark V1 as already applied
$usersExists = docker exec artifact-comparator-db psql -U admin -d artifact_comparator -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');"
if ($usersExists -match "t") {
    Write-Host "Users table exists. Marking V1 as applied..." -ForegroundColor Yellow
    docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c @"
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES (1, '1', 'create users table', 'SQL', 'V1__create_users_table.sql', NULL, 'admin', NOW(), 0, true);
"@
}

# Check questionnaires table to determine if V2 should be marked as applied
$questionnairesExists = docker exec artifact-comparator-db psql -U admin -d artifact_comparator -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questionnaires');"
if ($questionnairesExists -match "t") {
    Write-Host "Questionnaires table exists. Marking V2 as applied..." -ForegroundColor Yellow
    docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c @"
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES (2, '2', 'create questionnaire tables', 'SQL', 'V2__create_questionnaire_tables.sql', NULL, 'admin', NOW(), 0, true);
"@
}

# Check if scoring columns exist to determine if V3 should be marked as applied
$scoringExists = docker exec artifact-comparator-db psql -U admin -d artifact_comparator -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questionnaires' AND column_name = 'passing_threshold');"
if ($scoringExists -match "t") {
    Write-Host "Scoring configuration exists. Marking V3 as applied..." -ForegroundColor Yellow
    docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c @"
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES (3, '3', 'add scoring configuration', 'SQL', 'V3__add_scoring_configuration.sql', NULL, 'admin', NOW(), 0, true);
"@
}

Write-Host "`nUpdated migration history:" -ForegroundColor Cyan
docker exec artifact-comparator-db psql -U admin -d artifact_comparator -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;"

Write-Host "`nMigration history fixed! Restart backend now." -ForegroundColor Green
Write-Host "Run: docker-compose restart backend" -ForegroundColor Yellow

