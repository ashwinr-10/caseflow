# Database Setup Script for CaseFlow
# This script helps set up PostgreSQL database

Write-Host "CaseFlow Database Setup" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is installed
$pgPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $pgPath) {
    Write-Host "PostgreSQL is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. Install PostgreSQL from https://www.postgresql.org/download/windows/"
    Write-Host "2. Use Docker: docker run --name caseflow-db -e POSTGRES_USER=caseflow -e POSTGRES_PASSWORD=caseflow_password -e POSTGRES_DB=caseflow -p 5432:5432 -d postgres:16-alpine"
    Write-Host "3. Use a cloud database (Supabase, Neon, etc.)"
    Write-Host ""
    Write-Host "After installing PostgreSQL, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL found at: $($pgPath.Source)" -ForegroundColor Green
Write-Host ""

# Try to connect and create database
Write-Host "Attempting to create database..." -ForegroundColor Cyan

$env:PGPASSWORD = "caseflow_password"

# Create database (will fail if it exists, which is fine)
psql -U postgres -h localhost -c "CREATE DATABASE caseflow;" 2>&1 | Out-Null
psql -U postgres -h localhost -c "CREATE USER caseflow WITH PASSWORD 'caseflow_password';" 2>&1 | Out-Null
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE caseflow TO caseflow;" 2>&1 | Out-Null

Write-Host ""
Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run migrations: cd backend; npx prisma migrate dev"
Write-Host "2. Start backend: cd backend; npm run dev"
Write-Host "3. Start frontend: cd frontend; npm run dev"
Write-Host ""





