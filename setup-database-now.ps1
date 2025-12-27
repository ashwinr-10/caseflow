# Script to set up CaseFlow database
Write-Host "Setting up CaseFlow database..." -ForegroundColor Green
Write-Host ""

# Try to find psql
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "PostgreSQL psql not found in common locations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run this SQL manually in pgAdmin or psql:" -ForegroundColor Cyan
    Write-Host ""
    Get-Content "$PSScriptRoot\create-database.sql" | Write-Host
    Write-Host ""
    Write-Host "Or connect as postgres user and run:" -ForegroundColor Cyan
    Write-Host "  CREATE DATABASE caseflow;"
    Write-Host "  CREATE USER caseflow WITH PASSWORD 'caseflow_password';"
    Write-Host "  GRANT ALL PRIVILEGES ON DATABASE caseflow TO caseflow;"
    exit 1
}

Write-Host ""
Write-Host "You'll need to enter the postgres superuser password." -ForegroundColor Yellow
Write-Host "This is the password you set during PostgreSQL installation." -ForegroundColor Yellow
Write-Host ""

# Try to create database
$sql = @"
CREATE DATABASE caseflow;
CREATE USER caseflow WITH PASSWORD 'caseflow_password';
GRANT ALL PRIVILEGES ON DATABASE caseflow TO caseflow;
"@

Write-Host "Connecting to PostgreSQL..." -ForegroundColor Cyan
& $psqlPath -U postgres -h localhost -c $sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run migrations:" -ForegroundColor Cyan
    Write-Host "  cd backend"
    Write-Host "  npx prisma migrate dev"
} else {
    Write-Host ""
    Write-Host "❌ Failed to create database. Please run manually:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: Use pgAdmin" -ForegroundColor Cyan
    Write-Host "  1. Open pgAdmin"
    Write-Host "  2. Connect to PostgreSQL server"
    Write-Host "  3. Right-click 'Databases' → Create → Database"
    Write-Host "  4. Name: caseflow"
    Write-Host "  5. Then run: CREATE USER caseflow WITH PASSWORD 'caseflow_password';"
    Write-Host "  6. Then run: GRANT ALL PRIVILEGES ON DATABASE caseflow TO caseflow;"
    Write-Host ""
    Write-Host "Option 2: Use psql command line" -ForegroundColor Cyan
    Write-Host "  & '$psqlPath' -U postgres"
    Write-Host "  Then run the SQL commands from create-database.sql"
}






