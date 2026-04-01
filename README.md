# 🌸 Priyaraa — Handmade with Heart · Made Just for You

> *"Every purchase is a personal story, not a mass-produced transaction."*


![Priyaraa](https://img.shields.io/badge/Priyaraa-Handmade%20Marketplace-C2607E?style=for-the-badge&logo=heart&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-E8DFD0?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-v22+-3B6D11?style=for-the-badge&logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Status](https://img.shields.io/badge/status-live%20🌸-C2607E?style=for-the-badge)

**[✦ Quick Start](#-quick-start) · [Features](#-features) · [Pages](#-pages) · [API Docs](#-api-reference) · [Deploy](#-deployment)**

---

## ✦ What is Priyaraa?

**Priyaraa** is India's first **creator-first personalised handmade marketplace** — where artisans showcase products through aesthetic Pinterest-style feeds and reel-based videos, while buyers discover, customise, and co-create unique items directly with sellers.

Unlike Amazon (mass-produced, no story) or Instagram (no commerce, no trust), Priyaraa **combines inspiration + engagement + commerce** into one seamless, story-driven experience.

```
Buyer says:  "I want a plushie with my daughter's name 'Aanya', dusty rose, medium size"
                                        ↓
Artisan receives → chats with buyer → sends progress photos → ships with handwritten note
                                        ↓
               Buyer receives something literally made just for them 🌸
```

> No factory. No copy-paste. Just one human making something **just for you.**

---

## ✨ Features

### 🖼️ Discovery
- **Pinterest-style masonry feed** — browse by mood, vibe, aesthetic — not boring categories
- **Artisan Reels** — shoppable short videos of the actual making process
- **LIVE streaming badges** — artisans can go live while crafting
- **Category filters** — Jewellery, Art, Home, Custom, Textile, Gifts

### ✏️ Personalisation
- **Deep customisation** — name engraving, color picker, size selector, reference uploads
- **Custom notes** — any special instruction to the artisan
- **Co-creation via chat** — DM the artisan directly, track progress, see photos
- **🦄 Sona AI Gift Guide** — unicorn-themed AI that finds the perfect handmade gift

### 💬 Trust & Commerce
- **Verified seller profiles** — craft tags, ratings, reviews, response time
- **Real-time order tracking** — pending → confirmed → in progress → shipped → delivered
- **Auto-messaging** — artisan notified on every order, buyer updated on every status change
- **Buyer Moments** — share unboxing posts, community photo/reel feed
- **Escrow-ready** — secure payment flow (integration-ready for Razorpay)

### 🎨 Design & UI
- **4 beautiful themes** — Rose Light, Rose Dark, Sage Light, Forest Dark
- **Hand-drawn SVG doodles** — needle, thread, hearts, leaves, stars throughout
- **Responsive design** — desktop, tablet, mobile
- **Mobile PWA** — installable on any phone via browser
- **Gen Z language** — short, punchy, impactful copy everywhere

### 🔐 Authentication
- **Email + Password** — full JWT auth
- **Google OAuth** — one-click login (simulation, production-ready)
- **Phone OTP** — 6-digit OTP flow
- **Role-based access** — buyer or seller experience

---

## 📸 Pages

| Page | Route | What it does |
|------|-------|-------------|
| 🏠 **Landing** | `/` | Hero with floating cards, doodles, product feed, Sona banner, features, CTA |
| 🔐 **Login** | `/login.html` | Split-screen auth — email/phone/Google, role toggle, animated left panel |
| 🛍️ **Product** | `/product.html?id=1` | Product details, color picker, name input, size selector, place real order |
| 👩‍🎨 **Seller** | `/seller.html?id=1` | Full seller profile, product grid, reels, reviews, message button |
| 💬 **Chat** | `/chat.html` | Real-time buyer-seller messaging, conversation list, order card preview |
| 🦄 **Sona AI** | `/giftbot.html` | LLM-powered unicorn gift guide with 8 avatar options and occasion chips |
| 🎬 **Reels** | `/reels.html` | Artisan reels feed + buyer moments, like buttons, upload modal |
| 📱 **Mobile App** | `/app.html` | Full PWA — 5-tab bottom nav, home, explore, reels, Sona, profile |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| HTML5 + CSS3 | All 8 pages — no framework, pure and fast |
| **Instrument Serif** | Display / headline font (editorial feel) |
| **Caveat** | Handwritten accent font (artisan feel) |
| **DM Sans** | Body / UI font (clean readability) |
| SVG hand-drawn doodles | Needle, thread, hearts, leaves, stars — scattered throughout |
| CSS Custom Properties | 4-theme system — switchable with 🎨 button |
| JavaScript (vanilla) | All interactions, API calls, animations |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js v22+** | Runtime |
| **Express.js** | REST API server |
| **SQLite3** | Database — pure JS, no compilation needed, works everywhere |
| **bcryptjs** | Password hashing (salt rounds: 10) |
| **jsonwebtoken** | JWT auth — 7-day tokens |
| **multer** | Photo and reel file uploads |
| **cors** | Cross-origin requests |
| **dotenv** | Environment configuration |

### AI
| Technology | Purpose |
|-----------|---------|
| **Anthropic Claude API** | Sona AI — real LLM-powered gift guide |
| Custom system prompt | Gen Z unicorn persona trained on gift logic |
| Intelligent fallback | Occasion-based suggestions when API unavailable |

---

## 🗄️ Database Schema

**10 tables** — auto-created with demo seed data on first run.

```sql
users          — id, name, email, password, role, avatar, city, bio
sellers        — id, user_id, craft, verified, rating, total_sales, followers
products       — id, seller_id, title, description, price, emoji, custom_options, stock
orders         — id, buyer_id, seller_id, product_id, custom_name/color/size/note, status
messages       — id, sender_id, receiver_id, order_id, text, image_url, read
reels          — id, seller_id, caption, emoji, is_live, likes, comments
moments        — id, user_id, product_id, caption, image_url, likes
moment_likes   — id, moment_id, user_id (unique constraint)
reviews        — id, product_id, buyer_id, order_id, rating, comment
sona_logs      — id, user_id, query, category (analytics for Sona AI)
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js v16+** — [download here](https://nodejs.org)
- A terminal

### Run locally in 3 commands

```bash
# 1. Clone
git clone https://github.com/yourusername/priyaraa.git
cd priyaraa

# 2. Install
npm install

# 3. Start
npm start
```

Then open **`http://localhost:4000`** in your browser 🌸

The database auto-creates with 4 demo users, 5 products, and sample reels on first run.

### If port is already in use

```bash
kill -9 $(lsof -ti:4000) && npm start
```

---

## 🔑 Demo Accounts

| Name | Email | Password | Role |
|------|-------|----------|------|
| Meera Sharma | meera@priyara.com | password123 | 🧶 Seller |
| Aryan Verma | aryan@priyara.com | password123 | 🎨 Seller |
| Ananya Rao | ananya@priyara.com | password123 | 🛍️ Buyer |
| Rohan Das | rohan@priyara.com | password123 | 🛍️ Buyer |

---

## 📡 API Reference

All routes are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

### 🔐 Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/auth/register` | Create account | — |
| POST | `/auth/login` | Login → JWT token | — |
| POST | `/auth/google-login` | Google OAuth | — |
| GET | `/auth/me` | Get my profile | 🔒 |
| PUT | `/auth/profile` | Update name, avatar, city | 🔒 |
| PUT | `/auth/change-password` | Change password | 🔒 |

### 🛍️ Products
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/products` | List — filter by category, price, search | — |
| GET | `/products/:id` | Single product + reviews | — |
| POST | `/products` | Create listing | 🔒 Seller |
| PUT | `/products/:id` | Update listing | 🔒 Seller |
| DELETE | `/products/:id` | Delete listing | 🔒 Seller |
| POST | `/products/:id/review` | Post review | 🔒 Buyer |

### 📦 Orders
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/orders` | Place order | 🔒 |
| GET | `/orders` | My orders (buyer or seller) | 🔒 |
| GET | `/orders/:id` | Single order detail | 🔒 |
| PUT | `/orders/:id/status` | Update status | 🔒 Seller |
| PUT | `/orders/:id/cancel` | Cancel (pending only) | 🔒 Buyer |

### 💬 Messages
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/messages/conversations` | All my chats | 🔒 |
| GET | `/messages/:userId` | Chat history | 🔒 |
| POST | `/messages/:userId` | Send message | 🔒 |
| GET | `/messages/unread/count` | Unread count | 🔒 |

### 🎬 Reels & ✨ Moments
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/reels` | List reels (filter: category, live) | — |
| POST | `/reels` | Post reel | 🔒 Seller |
| POST | `/reels/:id/like` | Like reel | 🔒 |
| GET | `/moments` | Buyer moments feed | — |
| POST | `/moments` | Share moment + file upload | 🔒 |
| POST | `/moments/:id/like` | Toggle like | 🔒 |

### 👩‍🎨 Sellers & 🦄 Sona
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/sellers` | All sellers | — |
| GET | `/sellers/:id` | Seller + products + reels + reviews | — |
| POST | `/sona/query` | Gift suggestions + logs query | — |

### Quick test
```bash
# Health check
curl http://localhost:4000/api/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"meera@priyara.com","password":"password123"}'

# Get products
curl http://localhost:4000/api/products

# Ask Sona
curl -X POST http://localhost:4000/api/sona/query \
  -H "Content-Type: application/json" \
  -d '{"query":"birthday gift for my mom, budget 1000"}'
```

---

## 🌍 Deployment

### Railway (Recommended — Free ⭐)
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → Login with GitHub
3. **New Project → Deploy from GitHub repo**
4. Set environment variables:
   ```
   PORT=4000
   JWT_SECRET=your_secret_key_here
   NODE_ENV=production
   ```
5. Deploy → get URL like `priyaraa.up.railway.app` 🎉

### Render (Free alternative)
1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add env vars → Deploy

### Share on local network
```bash
# Find your IP
ipconfig getifaddr en0   # Mac
ipconfig                 # Windows

# Others on same WiFi visit:
http://YOUR_IP:4000
```

---

## ⚙️ Environment Variables

```env
PORT=4000
JWT_SECRET=your_super_secret_key_change_in_production
DB_PATH=./priyara.db
UPLOAD_DIR=./uploads
NODE_ENV=development
```

---

## 📁 Project Structure

```
priyaraa/
│
├── server.js                 ← Express app, routes, static serving
├── database.js               ← SQLite setup, 10 tables, auto-seed demo data
├── package.json
├── .env
│
├── middleware/
│   └── auth.js               ← JWT verify, sellerOnly, optionalAuth
│
├── routes/
│   ├── auth.js               ← Register, login, Google, profile
│   ├── products.js           ← CRUD + reviews
│   ├── orders.js             ← Order flow + status + notifications
│   ├── messages.js           ← Chat + conversations + unread count
│   └── social.js             ← Reels, moments, sellers, Sona AI
│
└── public/                   ← Frontend (served by Express as static)
    ├── style.css             ← Shared CSS + 4 theme variables
    ├── api.js                ← Shared JS API client (PriyaraaAPI object)
    ├── index.html            ← Landing page
    ├── login.html            ← Auth (email/phone/Google + register)
    ├── product.html          ← Product detail + customise + order
    ├── seller.html           ← Seller profile + products
    ├── chat.html             ← Real-time messaging
    ├── giftbot.html          ← Sona AI unicorn gift guide
    ├── reels.html            ← Reels + buyer moments
    └── app.html              ← Mobile PWA (installable)
```

---

## 🎨 Theme System

Switch themes anytime with the **🎨 button** (bottom-right of every page). Preference saves to `localStorage`.

| Theme | Background | Accent | Vibe |
|-------|-----------|--------|------|
| 🌸 **Rose Light** | `#FBF7F0` warm cream | `#C2607E` rose pink | cozy default |
| 🌙 **Rose Dark** | `#0f0d0b` deep ink | `#e8849e` soft rose | late night mode |
| 🌿 **Sage Light** | `#f4faf6` mint cream | `#4a8c5c` sage green | fresh + earthy |
| 🌲 **Forest Dark** | `#080f0a` forest night | `#6abf80` mint glow | moody forest |

---

## 🦄 Sona — AI Gift Guide

Sona is Priyaraa's Gen Z unicorn AI bestie — trained to find the perfect handmade gift.

**8 personality avatars:** 🦄 classic · 🌸 sakura · ⚡ bolt · 🐉 draco · 🌙 luna · 🔥 blaze · 🌊 wave · 🐺 rex

**How it works:**
1. User describes the person, occasion, budget
2. Sona calls Claude claude-sonnet-4-20250514 with a custom Gen Z system prompt
3. Claude returns gift suggestions formatted for the UI
4. If API unavailable, intelligent local fallback activates
5. Query logged to `sona_logs` for analytics

**To enable real LLM:** The Claude API is called client-side. For production, proxy through your backend to protect API keys.

---

## 🗺️ Roadmap

**Phase 2 — Launch (Month 1-3)**
- [ ] Razorpay payment gateway
- [ ] Real SMS OTP (MSG91 / Twilio)
- [ ] Real Google OAuth credentials
- [ ] Push notifications for chat + orders

**Phase 3 — Scale (Month 3-6)**
- [ ] 1,000+ verified sellers
- [ ] iOS + Android app (React Native)
- [ ] Logistics integration (Shiprocket)
- [ ] Live streaming reels (WebRTC)

**Phase 4 — Global (Year 2)**
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] AR product preview
- [ ] B2B corporate gifting
- [ ] Global expansion (Southeast Asia)

---

## 💡 Why Priyaraa Matters

**The problem:**
- 50M+ artisans in India with no proper digital storefront
- Selling through WhatsApp DMs and Instagram stories with no payments, no trust, no discovery
- Amazon sells mass products — no place for personalised, handmade commerce
- Buyers can't find authentic makers — scams, no verification, no story

**The solution:** One platform combining Pinterest-style discovery + artisan reels + deep customisation + direct chat + verified trust.

**The market:**
- ₹2,000Cr+ handmade market currently underserved
- 85% of Gen Z prefer unique, personalised products
- No existing platform combines all these features — **that is Priyaraa's unique advantage.**

---

## 👩‍💻 Built By

**Krishnapriya Kella** — CS 2nd Year Student, From LPU - Punjab
**Venkat Sangepu - CS 2nd Year Student, From LPU - Punjab

> *"I just want to help handmade and craft people build a platform where they can show their talents and sell. One person. One idea. One big dream."* 🌸

**Currently learning:** Cloud Computing (AWS), Full-Stack Development, Generative AI  
**Target:** Top-tier tech companies · Cloud + AI engineering roles

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first.

```bash
# Fork → Clone → Create branch
git checkout -b feature/your-amazing-idea

# Make changes → Commit
git commit -m "✨ add your amazing feature"

# Push → Open PR
git push origin feature/your-amazing-idea
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---


**Made with 🌸 for India's artisans**

*Priyaraa — handmade hits different*

⭐ **Star this repo** if you believe in the vision 🍴 **Fork** to build your own  💬 **Open an issue** to collaborate
