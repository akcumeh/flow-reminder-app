# Flow Reminder App

A modern reminder application with phone call notifications via Vapi.

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query (TanStack Query)
- Zod validation

**Backend:**
- FastAPI
- SQLite + SQLAlchemy
- APScheduler
- Vapi API (via httpx)

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Vapi account (free credits work)
- Twilio phone number (trial is fine)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

**Backend** - Create `backend/.env`:
```
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id_here
```

**Frontend** - Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:3000`

## How It Works

### Scheduling
- APScheduler runs in-process with the FastAPI server
- When you create a reminder, a job is scheduled for the specified time
- At trigger time, the scheduler calls Vapi to initiate the phone call

### Status Updates
- Reminders start with `pending` status
- After successful Vapi call trigger: `completed`
- If Vapi call fails: `failed`

### Timezone Handling
- The app automatically detects your device timezone
- All times are stored in UTC in the database
- Display times are converted to your local timezone

## Quick Test Flow

1. Open `http://localhost:3000` in your browser
2. Click "New Reminder"
3. Fill in the form with a title, message body, your phone number in E.164 format (i.e. with country code, e.g. +1234567890), set time either using presets, enter a custom time, or choose a specific date and time
4. Submit and wait for the call at the scheduled time

## API Endpoints

- `GET /api/reminders` - List all reminders (optional status filter)
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/{id}` - Update reminder
- `DELETE /api/reminders/{id}` - Delete reminder

## Project Structure

```
frontend/
├── app/                    # Next.js pages
├── components/             # React components
└── lib/                    # Utilities and API client

backend/
└── app/
    ├── main.py            # FastAPI app and routes
    ├── models.py          # SQLAlchemy models
    ├── schemas.py         # Pydantic schemas
    ├── crud.py            # Database operations
    ├── db.py              # Database setup
    └── scheduler.py       # APScheduler + Vapi integration
```

## Notes

- The SQLite database (`reminders.db`) is created automatically on first run
- APScheduler jobs are stored in memory (not persisted across restarts)
- For production, consider using a persistent job store

## Troubleshooting

Here are some common errors you might run into while starting or using this application.

### Backend won't start
- Ensure Python virtual environment is activated
- Verify all dependencies installed: `pip install -r requirements.txt`
- Check that port 8000 is not in use

### Frontend build errors
- Delete `node_modules` and `.next` folders, then run `npm install` again
- Ensure Node.js version is 18 or higher

### Stuck "Creating..." when submitting a new reminder
- Check browser console for errors
- Verify backend is running at http://localhost:8000
- Check frontend `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Confirm CORS is configured correctly in backend

### No phone call received
- Without Vapi credentials, reminders will be marked as completed (dev mode)
- With Vapi credentials, check that phone number is in E.164 format (+1234567890) and that it is a US number as free-tier Vapi calls can only be made to US numbers
- Verify Vapi API key and phone number ID are correct in backend `.env`
- Check backend logs for Vapi API errors
