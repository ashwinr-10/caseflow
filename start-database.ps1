# Quick Database Setup Script
Write-Host "Starting PostgreSQL Database for CaseFlow" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check if Docker is available
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerAvailable) {
    Write-Host "Docker detected. Starting PostgreSQL container..." -ForegroundColor Cyan
    
    # Check if container already exists
    $existing = docker ps -a --filter "name=caseflow-db" --format "{{.Names}}"
    
    if ($existing -eq "caseflow-db") {
        Write-Host "Container exists. Starting it..." -ForegroundColor Yellow
        docker start caseflow-db
    } else {
        Write-Host "Creating new PostgreSQL container..." -ForegroundColor Cyan
        docker run --name caseflow-db `
            -e POSTGRES_USER=caseflow `
            -e POSTGRES_PASSWORD=caseflow_password `
            -e POSTGRES_DB=caseflow `
            -p 5432:5432 `
            -d postgres:16-alpine
    }
    
    Write-Host ""
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "✅ Database should be running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run migrations: cd backend; npx prisma migrate dev"
    Write-Host "2. Or push schema: cd backend; npx prisma db push"
    Write-Host ""
} else {
    Write-Host "Docker not found. Please choose one:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install Docker Desktop" -ForegroundColor Cyan
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop"
    Write-Host ""
    Write-Host "Option 2: Install PostgreSQL locally" -ForegroundColor Cyan
    Write-Host "  Download from: https://www.postgresql.org/download/windows/"
    Write-Host "  Then create database manually:"
    Write-Host "    CREATE DATABASE caseflow;"
    Write-Host "    CREATE USER caseflow WITH PASSWORD 'caseflow_password';"
    Write-Host "    GRANT ALL PRIVILEGES ON DATABASE caseflow TO caseflow;"
    Write-Host ""
    Write-Host "Option 3: Use a cloud database (Supabase/Neon)" -ForegroundColor Cyan
    Write-Host "  - Supabase: https://supabase.com (free tier available)"
    Write-Host "  - Neon: https://neon.tech (free tier available)"
    Write-Host "  Update DATABASE_URL in backend/.env"
    Write-Host ""
}





