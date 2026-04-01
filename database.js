const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const DB_PATH = process.env.DB_PATH || "./priyara.db";
const _db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error("❌ DB connect error:", err.message);
});

// ── Promise-based DB helper ──
const db = {
  run:  (sql, p=[]) => new Promise((res,rej) => _db.run(sql, p, function(err){ err ? rej(err) : res({lastInsertRowid: this.lastID, changes: this.changes}); })),
  get:  (sql, p=[]) => new Promise((res,rej) => _db.get(sql, p, (err,row) => err ? rej(err) : res(row))),
  all:  (sql, p=[]) => new Promise((res,rej) => _db.all(sql, p, (err,rows) => err ? rej(err) : res(rows || []))),
  exec: (sql)       => new Promise((res,rej) => _db.exec(sql, err => err ? rej(err) : res())),
};

// ══════════════════════════════════════════
//   INIT DB — CREATE ALL TABLES
// ══════════════════════════════════════════
async function initDB() {
  await db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'buyer',
      avatar      TEXT DEFAULT '🌸',
      avatar_bg   TEXT DEFAULT '#FDE8EF',
      sona_name   TEXT DEFAULT 'Sona',
      sona_personality TEXT DEFAULT 'warm',
      city        TEXT,
      bio         TEXT,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sellers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL UNIQUE,
      craft         TEXT NOT NULL,
      verified      INTEGER DEFAULT 0,
      rating        REAL DEFAULT 0.0,
      total_sales   INTEGER DEFAULT 0,
      followers     INTEGER DEFAULT 0,
      response_time TEXT DEFAULT '24h',
      created_at    TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id       INTEGER NOT NULL,
      title           TEXT NOT NULL,
      description     TEXT,
      price           REAL NOT NULL,
      emoji           TEXT DEFAULT '🎁',
      thumb_bg        TEXT DEFAULT '#FDE8EF',
      category        TEXT,
      is_customizable INTEGER DEFAULT 1,
      custom_options  TEXT,
      stock           INTEGER DEFAULT 10,
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id     INTEGER NOT NULL,
      seller_id    INTEGER NOT NULL,
      product_id   INTEGER NOT NULL,
      custom_name  TEXT,
      custom_color TEXT,
      custom_size  TEXT,
      custom_note  TEXT,
      total_price  REAL NOT NULL,
      status       TEXT DEFAULT 'pending',
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (buyer_id)   REFERENCES users(id),
      FOREIGN KEY (seller_id)  REFERENCES sellers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id   INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      order_id    INTEGER,
      text        TEXT,
      image_url   TEXT,
      read        INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sender_id)   REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reels (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id  INTEGER NOT NULL,
      caption    TEXT NOT NULL,
      emoji      TEXT DEFAULT '🎬',
      thumb_bg   TEXT DEFAULT '#1a1208',
      category   TEXT,
      is_live    INTEGER DEFAULT 0,
      likes      INTEGER DEFAULT 0,
      comments   INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (seller_id) REFERENCES sellers(id)
    );

    CREATE TABLE IF NOT EXISTS moments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      product_id INTEGER,
      caption    TEXT NOT NULL,
      image_url  TEXT,
      emoji      TEXT DEFAULT '📸',
      thumb_bg   TEXT DEFAULT '#FDE8EF',
      type       TEXT DEFAULT 'photo',
      likes      INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)    REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS moment_likes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id  INTEGER NOT NULL,
      user_id    INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(moment_id, user_id),
      FOREIGN KEY (moment_id) REFERENCES moments(id),
      FOREIGN KEY (user_id)   REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      buyer_id   INTEGER NOT NULL,
      order_id   INTEGER NOT NULL,
      rating     INTEGER NOT NULL,
      comment    TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (buyer_id)   REFERENCES users(id),
      FOREIGN KEY (order_id)   REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS sona_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER,
      query      TEXT NOT NULL,
      category   TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await seedDemoData();
  console.log("✅ Database ready!");
}

async function seedDemoData() {
  const row = await db.get("SELECT COUNT(*) as c FROM users");
  if (row && row.c > 0) return;

  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync("password123", 10);

  const m  = await db.run("INSERT INTO users (name,email,password,role,avatar,city,bio) VALUES (?,?,?,?,?,?,?)",
    ["Meera Sharma","meera@priyara.com",hash,"seller","🧶","Jaipur","I've been weaving and knitting since I was 8."]);
  const ar = await db.run("INSERT INTO users (name,email,password,role,avatar,city,bio) VALUES (?,?,?,?,?,?,?)",
    ["Aryan Verma","aryan@priyara.com",hash,"seller","🎨","Pune","Portrait artist."]);
  await db.run("INSERT INTO users (name,email,password,role,avatar,city) VALUES (?,?,?,?,?,?)",
    ["Ananya Rao","ananya@priyara.com",hash,"buyer","👩","Bangalore"]);
  await db.run("INSERT INTO users (name,email,password,role,avatar,city) VALUES (?,?,?,?,?,?)",
    ["Rohan Das","rohan@priyara.com",hash,"buyer","👨","Mumbai"]);

  const s1 = await db.run("INSERT INTO sellers (user_id,craft,verified,rating,total_sales,followers) VALUES (?,?,?,?,?,?)",
    [m.lastInsertRowid,"Textile & Knit",1,4.9,340,1200]);
  const s2 = await db.run("INSERT INTO sellers (user_id,craft,verified,rating,total_sales,followers) VALUES (?,?,?,?,?,?)",
    [ar.lastInsertRowid,"Portraits & Art",1,4.8,210,980]);

  await db.run("INSERT INTO products (seller_id,title,description,price,emoji,thumb_bg,category,is_customizable,custom_options,stock) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [s1.lastInsertRowid,"Custom Handwoven Plushie","Handwoven and hand-stuffed using premium cotton yarn.",1299,"🧸","#FDE8EF","textile",1,JSON.stringify({colors:["Dusty Rose","Sage Green","Peach"],sizes:["Small","Medium","Large"]}),10]);
  await db.run("INSERT INTO products (seller_id,title,description,price,emoji,thumb_bg,category,is_customizable,stock) VALUES (?,?,?,?,?,?,?,?,?)",
    [s1.lastInsertRowid,"Macramé Wall Art","Hand-knotted macramé wall piece.",1800,"🪡","#EAF3DE","home",1,10]);
  await db.run("INSERT INTO products (seller_id,title,description,price,emoji,thumb_bg,category,is_customizable,stock) VALUES (?,?,?,?,?,?,?,?,?)",
    [s1.lastInsertRowid,"Embroidery Hoop","Hand-embroidered hoop with custom names.",680,"🧵","#FAEEDA","textile",1,10]);
  await db.run("INSERT INTO products (seller_id,title,description,price,emoji,thumb_bg,category,is_customizable,stock) VALUES (?,?,?,?,?,?,?,?,?)",
    [s2.lastInsertRowid,"Custom Pet Portrait","Hand-painted portrait of your pet.",1800,"🎨","#E6F1FB","art",1,10]);
  await db.run("INSERT INTO products (seller_id,title,description,price,emoji,thumb_bg,category,is_customizable,stock) VALUES (?,?,?,?,?,?,?,?,?)",
    [s2.lastInsertRowid,"Family Portrait","Hand-painted family portraits.",2200,"👨‍👩‍👧","#FBEAF0","art",1,10]);

  await db.run("INSERT INTO reels (seller_id,caption,emoji,thumb_bg,category,is_live,likes,comments) VALUES (?,?,?,?,?,?,?,?)",
    [s1.lastInsertRowid,"Making baby Aanya's custom plushie 🧸","🧸","#3d1a2a","textile",1,2400,148]);
  await db.run("INSERT INTO reels (seller_id,caption,emoji,thumb_bg,category,is_live,likes,comments) VALUES (?,?,?,?,?,?,?,?)",
    [s2.lastInsertRowid,"Timelapse: pet portrait commission 🐶","🎨","#1a2a3d","art",0,5600,438]);

  console.log("✅ Demo data seeded — 4 users, 5 products, 2 reels");
}

module.exports = { db, initDB };
