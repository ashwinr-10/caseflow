# CaseFlow - Case Management System

A production-ready, accessible, and fast web application that enables operations teams to upload CSV files, review/clean data in a rich grid interface, and bulk-create cases through an API.

**One-liner:** "Import → Validate → Fix → Submit → Track"

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │   Backend   │ ──────> │  PostgreSQL │
│  (Next.js)  │         │  (Express)  │         │  (Prisma)   │
└─────────────┘         └─────────────┘         └─────────────┘
     Port 3000              Port 3001              Port 5432
```

### Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19 + TypeScript
- TanStack Table + Virtual for data grid
- Zustand for state management
- Tailwind CSS + Radix UI
- React Dropzone for file uploads

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- CSV parsing with csv-parse

**Infrastructure:**
- Docker Compose for local development
- GitHub Actions for CI/CD
- Vitest for testing
- Playwright for E2E tests

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)

### One-Command Setup

```bash
# Clone the repository
git clone <repo-url>
cd caseflow

# Start all services with Docker Compose
docker compose up
```

This will start:
- PostgreSQL on `localhost:5432`
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:3000`

### Manual Setup

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with API URL

# Start dev server
npm run dev
```

## 📁 Project Structure

```
caseflow/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/       # Auth, error handling
│   │   ├── utils/            # Validation, helpers
│   │   └── index.ts          # Entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/      # React components
│   │   ├── lib/              # API client, utils
│   │   └── store/            # Zustand stores
│   └── package.json
├── .github/workflows/        # CI/CD
└── docker-compose.yml
```

## 🔑 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/caseflow?schema=public"
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=52428800
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎯 Features

### Core User Journey

1. **Sign In** - Email + password authentication with JWT
2. **Upload CSV** - Drag & drop CSV file upload
3. **Preview Grid** - Virtualized, editable data grid with:
   - Inline cell editing
   - Column filtering
   - Row validation status
   - Error highlighting
4. **Validate & Fix** - Client-side validation with:
   - Required field checks
   - Email format validation
   - Phone E.164 format validation
   - Date range validation (1900-today)
   - Enum validation (category, priority)
5. **Fix All Helpers** - Bulk operations:
   - Trim whitespace
   - Title case names
   - Normalize phone numbers
6. **Submit** - Batch submission with:
   - Progress tracking
   - Error reporting
   - Success/failure summary
7. **Track** - Cases list with:
   - Server-side pagination
   - Filtering (status, category, date range)
   - Search functionality
   - Case details page with history

### Validation Rules

- `case_id`: Required, unique in file
- `applicant_name`: Required
- `dob`: Required, ISO date, 1900-today
- `email`: Optional, valid email format
- `phone`: Optional, E.164 format (auto-normalized)
- `category`: Required, enum (TAX, LICENSE, PERMIT)
- `priority`: Optional, enum (LOW, MEDIUM, HIGH), defaults to LOW

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

### E2E Tests

```bash
cd frontend
npm run test:e2e
```

## 🚢 Deployment

### Backend Deployment

1. Set environment variables in your hosting platform
2. Run migrations: `npx prisma migrate deploy`
3. Build: `npm run build`
4. Start: `npm start`

### Frontend Deployment

1. Set `NEXT_PUBLIC_API_URL` to your backend URL
2. Build: `npm run build`
3. Start: `npm start`

Or deploy to Vercel:

```bash
vercel --prod
```

## 📊 Performance Notes

### Handling 50k Rows

- **Virtualization**: TanStack Virtual renders only visible rows
- **Lazy Loading**: Data loaded in chunks
- **Web Workers**: CSV parsing can be offloaded (future enhancement)
- **Debounced Validation**: Validation runs on blur, not on every keystroke
- **Batch Processing**: Backend processes cases in chunks of 100

### Grid Performance

- Virtual scrolling with `@tanstack/react-virtual`
- Estimated row height: 50px
- Overscan: 10 rows
- Efficient re-renders with React.memo where applicable

## 🔒 Security Notes

- **Authentication**: JWT with refresh tokens
- **Input Validation**: Server-side validation with express-validator
- **SQL Injection**: Prisma ORM prevents SQL injection
- **XSS Protection**: React escapes by default, Helmet adds security headers
- **CORS**: Configured for specific frontend URL
- **Rate Limiting**: Can be added with express-rate-limit
- **File Upload**: Size limits and type validation

## 🎨 Design Decisions & Tradeoffs

### Grid Choice: TanStack Table

**Why:** 
- Headless, highly customizable
- Excellent TypeScript support
- Virtual scrolling built-in
- Active community

**Tradeoff:** More setup than AG Grid, but more flexible

### State Management: Zustand

**Why:**
- Simple API, less boilerplate than Redux
- TypeScript-first
- Small bundle size
- Persistence middleware for auth

**Tradeoff:** Less ecosystem than Redux, but sufficient for this app

### Schema Mapping Strategy

**Current:** Auto-detect columns from CSV header, validate against known schema

**Future Enhancement:** Allow users to map CSV columns to schema fields via UI

## 📝 API Reference

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Import

- `POST /api/import/upload` - Upload CSV file
- `POST /api/import/batch` - Batch create cases
- `GET /api/import` - List import jobs
- `GET /api/import/:id` - Get import job details

### Cases

- `GET /api/cases` - List cases (with pagination, filters)
- `GET /api/cases/:id` - Get case details
- `PATCH /api/cases/:id` - Update case
- `POST /api/cases/:id/notes` - Add note to case

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Check connection
psql -h localhost -U caseflow -d caseflow
```

### Port Conflicts

Change ports in `docker-compose.yml` or `.env` files

### Prisma Issues

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate client
npx prisma generate
```

## 📄 License

MIT

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📧 Contact

For questions or issues, please open a GitHub issue or contact: hiring@skycladventures.com

---

**Built with ❤️ for efficient case management**

