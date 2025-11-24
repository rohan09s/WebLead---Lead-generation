- **Frontend:** React (Vite)
- **Backend:** Node + Express + Socket.IO (optional MongoDB via Mongoose)
- **Realtime:** Socket.IO for new-lead notifications
- **APIs:** REST endpoints for businesses and leads

**Contents**
- `/backend` - Express server
- `/frontend` - Vite + React app

**How to run**

1. Backend
```bash
cd backend
npm install
npm run dev
```

2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend will talk to `http://localhost:4000` by default. See `backend/.env` and `frontend/src/api.js`.
- The backend includes a fallback in-memory store if no MongoDB URI provided.

Enjoy!
