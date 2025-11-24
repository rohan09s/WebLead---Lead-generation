# Backend (Express)

Install:
```
cd backend
npm install
```

Run:
```
# optional: create .env from .env.example, set MONGO_URI
npm run dev
```

API endpoints:
- GET /api/businesses
- GET /api/businesses/:id
- POST /api/leads  { name, phone, message, businessId }
- GET /api/leads

Websockets:
- Socket.IO emits `new-lead` on new lead creation
