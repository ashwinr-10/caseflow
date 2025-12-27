-- SQL script to create CaseFlow database and user
-- Run this as the postgres superuser

-- Create database (if it doesn't exist)
CREATE DATABASE caseflow;

-- Create user (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'caseflow') THEN
        CREATE USER caseflow WITH PASSWORD 'caseflow_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE caseflow TO caseflow;

-- Connect to caseflow database and grant schema privileges
\c caseflow
GRANT ALL ON SCHEMA public TO caseflow;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO caseflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO caseflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO caseflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO caseflow;






