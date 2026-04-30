import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/* ======================================================
   ✅ CORS CONFIG (ENV-BASED + LOCAL FALLBACK)
====================================================== */

// Allow multiple environments
const allowedOrigins = [
  process.env.FRONTEND_URL,          // from .env (prod or custom)
  "http://localhost:5173",           // local dev fallback
];

// Clean undefined values
const filteredOrigins = allowedOrigins.filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (filteredOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["POST"],
    credentials: true,
  })
);

app.use(express.json());

/* ======================================================
   ✅ CONTACT API
====================================================== */

app.post("/contact", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      service,
      aiProduct,
      message,
    } = req.body;

    // ✅ Validation
    if (
      !name?.trim() ||
      !email?.trim() ||
      !message?.trim() ||
      !service
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    /* ======================================================
       ✅ EMAIL TRANSPORT
    ====================================================== */

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    /* ======================================================
       ✅ EMAIL CONTENT
    ====================================================== */

    const mailOptions = {
      from: `"Contact Form" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `New AI Lead: ${service} | ${name}`,
      html: `
        <h3>New Enquiry</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Company:</strong> ${company || "N/A"}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>AI Product:</strong> ${aiProduct || "N/A"}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    /* ======================================================
       ✅ SEND EMAIL
    ====================================================== */

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Message sent successfully",
    });

  } catch (err) {
    console.error("Mail Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
});

/* ======================================================
   ✅ HEALTH CHECK (OPTIONAL BUT USEFUL)
====================================================== */

app.get("/", (req, res) => {
  res.send("API is running...");
});

/* ======================================================
   ✅ START SERVER
====================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});