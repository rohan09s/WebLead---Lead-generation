# IndiaMart/JustDial - Minimal Fullstack Clone (Boilerplate)

This is a minimal, opinionated boilerplate that demonstrates a marketplace/lead-inquiry flow similar to IndiaMart / JustDial.

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
# set MONGO_URI in .env if you want MongoDB (optional). If missing, server uses in-memory store.
npm run dev
```

2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend will talk to `http://localhost:4000` by default. See `backend/.env.example` and `frontend/src/api.js`.

**Notes**
- This is a starting point: add authentication, validation, production build, CORS/security for production, and a real DB for persistence.
- The backend includes a fallback in-memory store if no MongoDB URI provided.

Enjoy!