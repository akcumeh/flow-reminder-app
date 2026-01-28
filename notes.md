# Flow Reminder App - Development Notes

## Project Goal
Build a premium reminder app with phone call notifications via Vapi.

## Scoring Weights
- **UI/UX Excellence**: 40% - Must feel like a real SaaS product
- **Frontend Architecture**: 25% - Clean components, good patterns
- **Backend + Scheduling**: 20% - Reliable, correct status updates
- **Integration Quality**: 15% - Vapi works, clear setup

## Tech Stack Decisions

### Frontend
- **Next.js 14 (App Router)** - Latest patterns, RSC support
- **TypeScript** - Full type safety
- **Tailwind + shadcn/ui** - Industry standard, highly customizable, fastest option as opposed to composing design from scratch
- **React Query (TanStack Query)** - Best-in-class data fetching with caching, optimistic updates
- **Zod** - Runtime validation matching backend
- **date-fns + date-fns-tz** - Timezone handling

### Backend
- **FastAPI** - Required, fast, great validation
- **SQLite + SQLAlchemy** - Simple, local
- **APScheduler** - Background job scheduling for reminder triggers
- **Pydantic** - Request/response validation
- **Vapi SDK** - Phone call integration

### Why These Choices
- **shadcn/ui over MaterialUI**: More modern, better tree-shaking, looks premium by default
- **React Query over plain fetch**: Automatic caching, loading states, error handling, optimistic updates
- **SQLite over Postgres**: Simpler setup for demo, no Docker complexity unless needed
- **APScheduler over Celery**: Lighter weight, runs in-process, perfect for demo scale

## Development Phases

### Phase 1: Setup & Foundation
- Initialize Next.js with TypeScript
- Set up FastAPI project structure
- Install core dependencies
- Configure dev environment

### Phase 2: Design System
- Setup Tailwind config
- Install shadcn/ui components
- Define color palette, spacing, typography
- Create core UI primitives

### Phase 3: Backend Core
- Database schema and models
- CRUD API endpoints
- Validation with Pydantic
- Basic error handling

### Phase 4: Scheduler + Vapi
- APScheduler setup
- Vapi integration for calls
- Status update logic
- Error handling for call failures

### Phase 5: Frontend Features
- Reminder creation form
- Dashboard with filters
- Empty/loading/error states
- Delete/Edit functionality

### Phase 6: Polish
- Responsive design
- Micro-interactions
- Accessibility
- Final testing

---

## Logs
## Build Log

### Commit 1: Set up Next.js 16 & frontend core
- Next.js 16 with App Router, TypeScript, Tailwind
- React Query, Zod, date-fns dependencies installed
- shadcn/ui foundation (CVA, clsx, tailwind-merge)

### Commit 2: Create backend
- SQLAlchemy models with Reminder table (status enum: pending/completed/failed)
- Pydantic schemas with E.164 phone validation
- CRUD operations isolated from routes
- Database setup with SQLite

### Commit 3: Complete backend with API routes & scheduler
- FastAPI REST endpoints (GET/POST/PUT/DELETE /api/reminders)
- APScheduler triggers reminders at scheduled time
- Status updates after trigger (completed/failed based on success)
- CORS configured for Next.js localhost:3000

