import express from "express";
import cors from "cors";

import leadRoutes from "./routes/lead.routes.js";



const app = express();

/* ======================================================
   ✅ CORS CONFIG (PRODUCTION SAFE)
====================================================== */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,

  "http://localhost:5173", // main site
  "http://localhost:5174", // admin panel
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

/* ======================================================
   ✅ ROUTES
====================================================== */

app.use("/api", leadRoutes);

/* ======================================================
   ✅ HEALTH CHECK
====================================================== */

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;