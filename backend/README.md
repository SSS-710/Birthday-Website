# 🌙 The Unknown Man — Backend API

> Production-ready Node.js + Express + MongoDB + Socket.IO backend for a private romantic birthday website.

---

## 📁 Folder Structure

```
backend/
├── server.js                   ← Entry point — HTTP + Socket.IO
├── app.js                      ← Express app factory
├── package.json
├── .env                        ← Your secrets (never commit)
├── .env.example                ← Template
├── .gitignore
│
├── config/
│   └── db.js                   ← MongoDB Atlas connection
│
├── models/
│   ├── User.js                 ← User schema (bcrypt, online status)
│   ├── Message.js              ← Message schema (seen, edit, soft-delete)
│   └── Photo.js                ← Photo/memory schema (future)
│
├── routes/
│   ├── auth.routes.js          ← POST /login, GET /me, refresh, logout
│   ├── message.routes.js       ← CRUD + mark-seen
│   └── user.routes.js          ← List, get, update avatar
│
├── controllers/
│   ├── auth.controller.js
│   ├── message.controller.js
│   └── user.controller.js
│
├── middleware/
│   ├── auth.middleware.js      ← JWT protect, requireAdmin
│   ├── error.middleware.js     ← AppError class + global handler
│   ├── validate.middleware.js  ← express-validator runner
│   └── rateLimiter.middleware.js
│
├── socket/
│   └── socket.handler.js       ← All Socket.IO events
│
└── utils/
    ├── generateToken.js        ← JWT signer
    ├── seedUsers.js            ← One-time user seeder
    └── logger.js               ← Colour-coded console logger
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your real values:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random string ≥ 64 chars |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLIENT_URL` | Comma-separated frontend URLs |
| `ADMIN_PASSWORD` | Password for admin user |
| `BHUMIKA_PASSWORD` | Password for Bhumika |
| `PORT` | Server port (default: 5000) |

### 3. Seed Users (run once)

```bash
npm run seed
```

This creates **admin** and **bhumika** in MongoDB with bcrypt-hashed passwords.

### 4. Start Development Server

```bash
npm run dev
```

### 5. Start Production Server

```bash
npm start
```

---

## 🔐 Authentication

Only **two users** exist. No signup. Login only.

```
POST /api/auth/login
{
  "username": "admin",
  "password": "YourAdminPassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "_id": "...", "username": "admin", "displayName": "The Unknown Man" }
}
```

All subsequent requests need:
```
Authorization: Bearer <token>
```

---

## 📡 API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | Login — get JWT |
| `GET`  | `/api/auth/me` | ✅ | Get current user |
| `POST` | `/api/auth/refresh` | ✅ | Refresh token |
| `POST` | `/api/auth/logout` | ✅ | Logout |

### Messages
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/api/messages` | ✅ | Get conversation history (paginated) |
| `POST`   | `/api/messages` | ✅ | Send message (REST fallback) |
| `PUT`    | `/api/messages/:id` | ✅ | Edit message (15-min window) |
| `DELETE` | `/api/messages/:id` | ✅ | Soft-delete message |
| `PUT`    | `/api/messages/seen` | ✅ | Mark messages as seen |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users` | ✅ | List both users + online status |
| `GET` | `/api/users/:id` | ✅ | Get user by ID |
| `PUT` | `/api/users/avatar` | ✅ | Update emoji avatar |

### System
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | ❌ | Health check |

---

## ⚡ Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `send-message` | `{ receiverId, message }` | Send a message |
| `typing` | `{ receiverId }` | Start typing |
| `stop-typing` | `{ receiverId }` | Stop typing |
| `message-seen` | `{ messageId, senderId }` | Mark as seen |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `receive-message` | Message object | New incoming message |
| `typing` | `{ senderId, displayName }` | Other user typing |
| `stop-typing` | `{ senderId }` | Other user stopped typing |
| `message-seen` | `{ messageId, seenAt }` | Your message was read |
| `message-deleted` | `{ messageId }` | Message deleted |
| `message-edited` | Message object | Message edited |
| `user-online` | User info | Other user came online |
| `user-offline` | `{ userId, lastSeen }` | Other user went offline |

**Socket auth:** Connect with `auth: { token: "<JWT>" }`

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| Passwords | `bcryptjs` (12 rounds) |
| Auth | JWT (7-day expiry) |
| Headers | `helmet` |
| Rate Limiting | `express-rate-limit` (100 req/15min, 10 logins/15min) |
| NoSQL Injection | `express-mongo-sanitize` |
| Input Validation | `express-validator` |
| CORS | Whitelist-only |
| Sensitive fields | `select: false` on password field |

---

## 🌐 Frontend Integration

Add `js/api.js` to your HTML pages:

```html
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script src="js/api.js"></script>
```

Then use globally via `window.TUM`:

```js
// Login
const { token, user } = await TUM.AuthAPI.login('bhumika', 'password');

// Load messages
const { data } = await TUM.MessageAPI.getHistory();

// Connect socket
const chat = new TUM.ChatSocket();
chat.connect();
chat.on('receive-message', (msg) => renderMessage(msg));
await chat.sendMessage(receiverId, 'Hello! 💕');
```

---

## 🚀 Deployment

### Render / Railway (Backend)

1. Push `backend/` to GitHub
2. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app)
3. Set environment variables from `.env.example`
4. Build command: `npm install`
5. Start command: `npm start`
6. Run `npm run seed` once via the console

### Vercel (Frontend)

1. Push frontend files to GitHub
2. Deploy on [Vercel](https://vercel.com)
3. Set `window.BACKEND_URL = 'https://your-backend.onrender.com/api'` in your HTML

---

## 💻 Development Commands

```bash
npm run dev    # Start with nodemon (auto-reload)
npm run seed   # Seed admin + bhumika to MongoDB
npm start      # Production start
```

---

*Built with ❤️ — The Unknown Man Backend*
