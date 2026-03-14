# Phobos End-to-End Setup

This guide runs the full stack locally:

- MongoDB (for backend event logging)
- Backend API (Node.js + TypeScript)
- Frontend app (Vite + React)

## 1. Prerequisites

Install these first:

- Node.js 18+
- npm 9+
- MongoDB 7+ (or Docker)
- exiftool
- rclone

Optional but recommended:

- Google Drive OAuth/Firebase credentials for login and Drive backup features

## 2. Start MongoDB

Use one option.

### Option A: Local MongoDB service

Make sure MongoDB is running on `mongodb://localhost:27017`.

### Option B: Docker

```bash
docker run -d --name phobos-mongo -p 27017:27017 mongo:7
```

## 3. Configure and run backend

### 3.1 Install dependencies

```bash
cd phobos-backend
npm install
```

### 3.2 Create backend env file

Copy `.env.example` to `.env` and adjust as needed:

```env
DAEMON_MODE=false
WATCH_DIR=/data/watch
OUTPUT_DIR=/data/clean
VERBOSE_LOGGING=false
HOST=0.0.0.0
PORT=8000

RCLONE_REMOTE_NAME=gdrive
RCLONE_DEST_PATH=backups

MONGODB_ENABLED=true
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=phobos
MONGODB_COLLECTION=file_events
```

Notes:

- `MONGODB_ENABLED=true` enables event logging into MongoDB.
- `rclone` must be configured (`rclone config`) if you want backup/link features to succeed.

### 3.3 Run backend API

```bash
npm run dev -- run-api
```

Expected:

- API listens on `http://localhost:8000`

Quick checks (new terminal):

```bash
curl http://localhost:8000/health
curl http://localhost:8000/status
```

## 4. Configure and run frontend

### 4.1 Install dependencies

```bash
cd ../phobos-frontend
npm install
```

### 4.2 Create frontend env file

Create `phobos-frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000

# Firebase Auth (required for login features)
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
VITE_FIREBASE_STORAGE_BUCKET=your_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
VITE_FIREBASE_APP_ID=your_value

# Optional: Google Drive browser client ID
VITE_GOOGLE_DRIVE_CLIENT_ID=your_value
```

### 4.3 Run frontend

```bash
npm run dev
```

Expected:

- Frontend at `http://localhost:8080`

## 5. End-to-end test flow

1. Open `http://localhost:8080`.
2. Sign in (if Firebase env vars are configured).
3. Go to Upload page (`/upload`).
4. Upload a supported file (`.jpg`, `.jpeg`, `.png`, `.pdf`, `.mp4`, `.mov`).
5. Click process. This calls backend `POST /sanitize`.
6. Go to Cleaned Files page (`/cleaned`).
7. Verify processed entries are shown from backend `GET /api/cleaned-files`.

## 6. Helpful commands

Backend tests:

```bash
cd phobos-backend
npm test
```

Frontend production build:

```bash
cd phobos-frontend
npm run build
```

## 7. Common issues

- `MongoDB connection error`
  - Confirm MongoDB is running and `MONGODB_URI` is correct.

- `sanitize/backup failures`
  - Ensure `exiftool` and `rclone` are installed and available in PATH.
  - Ensure `rclone` remote exists and `RCLONE_REMOTE_NAME` matches it.

- Frontend auth/login issues
  - Verify all Firebase `VITE_FIREBASE_*` values in `.env.local`.

- Frontend cannot reach backend
  - Confirm backend is running on `:8000`.
  - Confirm `VITE_API_BASE_URL=http://localhost:8000`.
