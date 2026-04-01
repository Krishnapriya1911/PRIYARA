# 🌸 Priyara Backend

Node.js + Express + SQLite backend — no native compilation needed, works on Mac, Windows, Linux.

---

## 🚀 Setup — 3 steps

```bash
# Step 1 — go into the folder
cd priyara_backend

# Step 2 — install dependencies (uses sqlite3, NOT better-sqlite3)
npm install

# Step 3 — start the server
npm start
```

Then open: **http://localhost:5000/api/health**
You should see: `🌸 Priyara backend is running!`

---

## ⚠️ Common Errors & Fixes

### Error: `gyp ERR! build error` or `better-sqlite3` fails
This version uses **sqlite3** (not better-sqlite3), so this error should NOT happen.
If it does: `npm uninstall better-sqlite3 && npm install`

### Error: `nodemon: command not found`
This version uses `npm start` which runs `node server.js` directly. No nodemon needed.

### Error: `Cannot find module 'sqlite3'`
Run: `npm install` again from inside the `priyara_backend` folder.

---

## 📡 All API Endpoints

### 🔐 Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → get token |
| GET  | `/api/auth/me` | My profile 🔒 |
| PUT  | `/api/auth/profile` | Update profile 🔒 |
| PUT  | `/api/auth/change-password` | Change password 🔒 |

### 🛍️ Products
| Method | URL | Description |
|--------|-----|-------------|
| GET    | `/api/products` | Browse products |
| GET    | `/api/products/:id` | Product detail + reviews |
| POST   | `/api/products` | Add product 🔒 seller |
| PUT    | `/api/products/:id` | Edit product 🔒 seller |
| DELETE | `/api/products/:id` | Delete product 🔒 seller |
| POST   | `/api/products/:id/review` | Post review 🔒 buyer |

### 📦 Orders
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/orders` | Place order 🔒 |
| GET  | `/api/orders` | My orders 🔒 |
| GET  | `/api/orders/:id` | Order detail 🔒 |
| PUT  | `/api/orders/:id/status` | Update status 🔒 seller |
| PUT  | `/api/orders/:id/cancel` | Cancel order 🔒 buyer |

### 💬 Messages
| Method | URL | Description |
|--------|-----|-------------|
| GET  | `/api/messages/conversations` | My chats 🔒 |
| GET  | `/api/messages/:userId` | Chat history 🔒 |
| POST | `/api/messages/:userId` | Send message 🔒 |
| GET  | `/api/messages/unread/count` | Unread count 🔒 |

### 🎬 Reels & ✨ Moments & 👩‍🎨 Sellers & 🌸 Sona
| Method | URL | Description |
|--------|-----|-------------|
| GET    | `/api/reels` | All reels |
| POST   | `/api/reels` | Post reel 🔒 seller |
| POST   | `/api/reels/:id/like` | Like reel 🔒 |
| GET    | `/api/moments` | Buyer moments |
| POST   | `/api/moments` | Share moment 🔒 |
| POST   | `/api/moments/:id/like` | Toggle like 🔒 |
| GET    | `/api/sellers` | All sellers |
| GET    | `/api/sellers/:id` | Seller detail |
| POST   | `/api/sona/query` | Gift suggestions |

🔒 = Add `Authorization: Bearer YOUR_TOKEN` to request header

---

## 🧪 Quick Test

### 1. Login as demo seller
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"meera@priyara.com","password":"password123"}'
```
Copy the `token` from the response.

### 2. Get all products
```bash
curl http://localhost:5000/api/products
```

### 3. Ask Sona for gift ideas
```bash
curl -X POST http://localhost:5000/api/sona/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Birthday gift for my mom, budget 1000"}'
```

---

## 👥 Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| meera@priyara.com | password123 | seller |
| aryan@priyara.com | password123 | seller |
| ananya@priyara.com | password123 | buyer |
| rohan@priyara.com | password123 | buyer |

---

## 🔗 Connect to Frontend

In your HTML pages, add this to talk to the backend:

```javascript
const API = "http://localhost:5000/api";

// Login
async function login(email, password) {
  const res  = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
  }
  return data;
}

// Authenticated request helper
async function apiFetch(url, options={}) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers
    }
  }).then(r => r.json());
}

// Examples:
const products = await apiFetch("/products");
const orders   = await apiFetch("/orders");
const me       = await apiFetch("/auth/me");
await apiFetch("/orders", { method:"POST", body: JSON.stringify({ product_id:1, custom_name:"Aanya" }) });
```

---

## 🛠 Tech Stack
- **Node.js** + **Express** — server
- **sqlite3** — database (pure JS, no compilation!)
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT auth
- **multer** — file/photo uploads
- **cors** — frontend connection
- **dotenv** — config

Made with 🌸 for Priyara
