# Quick Setup Guide

## Step 1: Create Environment Files

### Backend (.env)
Create `backend/.env` with:
```
DATABASE_URL="postgresql://caseflow:caseflow_password@localhost:5432/caseflow?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=52428800
```

### Frontend (.env.local)
Create `frontend/.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Step 2: Set Up Database

### Option A: Using Docker (Recommended)
```bash
docker run --name caseflow-db -e POSTGRES_USER=caseflow -e POSTGRES_PASSWORD=caseflow_password -e POSTGRES_DB=caseflow -p 5432:5432 -d postgres:16-alpine
```

### Option B: Local PostgreSQL
1. Install PostgreSQL if not installed
2. Create database:
```sql
CREATE DATABASE caseflow;
CREATE USER caseflow WITH PASSWORD 'caseflow_password';
GRANT ALL PRIVILEGES ON DATABASE caseflow TO caseflow;
```

## Step 3: Run Migrations

```bash
cd backend
npx prisma migrate dev
```

## Step 4: Start Services

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## Step 5: Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health





