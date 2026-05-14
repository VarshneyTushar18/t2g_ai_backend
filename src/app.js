import express from "express";
import cors from "cors";

import pool from "./config/db.js";
import leadRoutes from "./routes/lead.routes.js";
import authRoutes from "./routes/auth.routes.js";


const app = express();

/* ======================================================
   ✅ CORS CONFIG (PRODUCTION SAFE)
====================================================== */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,

  "http://localhost:5173", // main site
  "http://127.0.0.1:5173",
  "http://localhost:8080", // admin panel
  "http://localhost:3000", // fallback
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman / server-to-server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("❌ CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* ======================================================
   ✅ BODY PARSER (IMPORTANT)
====================================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, database: "connected" });
  } catch (e) {
    const msg = e?.sqlMessage || e?.message || String(e);
    return res.status(503).json({
      ok: false,
      database: "error",
      message: msg,
    });
  }
});

/* ======================================================
   ✅ ROUTES
====================================================== */

app.use("/api", leadRoutes);
app.use("/api/auth", authRoutes);

/* ======================================================
   ✅ HEALTH CHECK
====================================================== */

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;