import pool from "../config/db.js";
import axios from "axios";
import { createTransporter } from "../utils/email.service.js";
import { getClientIp, normalizeIp } from "../utils/ip.service.js";

const LEAD_EMAILS =  ["info@tech2globe.com", "enquiries@tech2globe.net"];
const SENDER_EMAIL = process.env.SMTP_EMAIL || process.env.SMTP_USER;


// ["info@tech2globe.com", "enquiries@tech2globe.net"];



/**
 * Format datetime for email display
 */
const formatSubmittedAt = (date) => {
  const iso = date.toISOString();
  return `${iso} UTC`;
};

/**
 * Generate readable location
 */
const generateLocation = (country, geoData) => {
  if (!country) return "Unknown";

  if (geoData?.city || geoData?.region) {
    const parts = [];

    if (geoData.city && geoData.city !== "-") {
      parts.push(geoData.city);
    }

    if (geoData.region && geoData.region !== "-") {
      parts.push(geoData.region);
    }

    parts.push(country);

    return parts.join(", ");
  }

  return country;
};

export const createLead = async (req, res) => {
  try {
    console.log("=== LEAD SUBMISSION ===");

    console.log("Body received:", JSON.stringify(req.body, null, 2));

    console.log("Headers:", {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
      "cf-connecting-ip": req.headers["cf-connecting-ip"],
      referer: req.headers.referer,
    });

    // ================= REQUEST DATA =================
    const {
      name,
      email,
      phone,
      company,
      aiProduct,
      message,
      source_page,
    } = req.body;

    let country =
      req.body.country ||
      req.body.countryCode ||
      req.body.country_code ||
      null;

    // ================= VALIDATION =================
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, email, and message are required",
      });
    }

    if (!country?.trim()) {
      console.warn("⚠️ Country not provided");
      country = "Unknown";
    }

    // ================= CLIENT IP =================
    const rawIp = getClientIp(req);

    const senderIp = normalizeIp(rawIp);

    console.log({
      rawIp,
      normalizedIp: senderIp,
    });

    // ================= LOCATION & GEO =================
    let location = country;
    let geoData = null;

    try {
      // Use normalized IP here
      const geoResponse = await axios.get(
        `https://ipapi.co/${senderIp}/json/`,
        {
          timeout: 5000,
        }
      );

      geoData = geoResponse.data;

      console.log(
        "Geo lookup result:",
        JSON.stringify(geoData, null, 2)
      );

      location = generateLocation(country, geoData);

      console.log("Generated location:", location);
    } catch (error) {
      console.log("❌ Geo lookup failed:", error.message);
    }

    // ================= SOURCE PAGE =================
    const sourcePage =
      source_page || req.headers.referer || null;

    // ================= TIMESTAMP =================
    const submittedAt = new Date();

    // ================= DATABASE INSERT =================
    const [result] = await pool.execute(
      `INSERT INTO leads 
      (
        name,
        email,
        phone,
        company,
        ai_product,
        country,
        location,
        sender_ip,
        source_page,
        message,
        submitted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim(),
        phone?.trim() || null,
        company?.trim() || null,
        aiProduct?.trim() || null,
        country === "Unknown" ? null : country.trim(),
        location,
        senderIp,
        sourcePage,
        message.trim(),
        submittedAt,
      ]
    );

    console.log("✅ Lead inserted with ID:", result.insertId);
    console.log("Country:", country);
    console.log("Location:", location);
    console.log("Sender IP:", senderIp);
    console.log("Source Page:", sourcePage);
    console.log("Submitted At:", formatSubmittedAt(submittedAt));

    // ================= EMAILS =================
    try {
      const transporter = createTransporter();

      await Promise.all([
        transporter.sendMail({
          from: `"Contact Form" <${SENDER_EMAIL}>`,
          replyTo: email,
          to: LEAD_EMAILS.join(","),

          subject: `New AI Lead: ${aiProduct || "General"} | ${name}`,

          html: `
          <div style="background:#f4f4f4;padding:40px 20px;font-family:Arial,sans-serif;">
            <div style="max-width:700px;margin:auto;background:#ffffff;border-radius:10px;padding:35px;">

              <h2 style="margin-top:0;color:#111;">
                New AI Lead Received
              </h2>


              <h3 style="margin-bottom:15px;color:#222;">
                Contact Details
              </h3>

              <p><strong>Name:</strong> ${name}</p>

              <p>
                <strong>Email:</strong>
                <a href="mailto:${email}">
                  ${email}
                </a>
              </p>

              <p><strong>Phone:</strong> ${phone || "-"}</p>

              <p><strong>Company:</strong> ${company || "-"}</p>

              <p><strong>AI Product:</strong> ${aiProduct || "-"}</p>

              <p><strong>Country:</strong> ${country}</p>

              <p><strong>Location:</strong> ${location}</p>

              <p><strong>Sender IP:</strong> ${senderIp || "-"}</p>

              <h3 style="margin-bottom:15px;color:#222;">
                Message
              </h3>

              <p style="line-height:1.7;">
                ${message || "-"}
              </p>


              <h3 style="margin-bottom:15px;color:#222;">
                Additional Information
              </h3>

              <p>
                <strong>Source Page:</strong>
                ${
                  sourcePage
                    ? `<a href="${sourcePage}">${sourcePage}</a>`
                    : "-"
                }
              </p>

              <p>
                <strong>Submitted At:</strong>
                ${formatSubmittedAt(submittedAt)}
              </p>

            </div>
          </div>
          `,
        }),

        transporter.sendMail({
          from: `"Tech2Globe" <${SENDER_EMAIL}>`,
          to: email,

          subject: "We’ve received your enquiry",

          html: `
          <div style="background:#f4f4f4;padding:40px 20px;font-family:Arial,sans-serif;">

            <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:10px;padding:35px;">

              <h2 style="margin-top:0;color:#111;">
                Thank You for Contacting Us
              </h2>

              <p>Dear ${name},</p>

              <p style="line-height:1.7;">
                Thank you for contacting Tech2Globe.
                Our team has received your enquiry and will get back to you shortly.
              </p>

              <h3>Your Submitted Details</h3>

              <p><strong>Name:</strong> ${name}</p>

              <p><strong>Email:</strong> ${email}</p>

              <p><strong>Phone:</strong> ${phone || "-"}</p>

              <p><strong>Company:</strong> ${company || "-"}</p>

              <p><strong>AI Product:</strong> ${aiProduct || "-"}</p>

              <p><strong>Country:</strong> ${country}</p>

              <p>
                Regards,<br />
                <strong>Team Tech2Globe</strong>
              </p>

            </div>

          </div>
          `,
        }),
      ]);
    } catch (mailErr) {
      console.error(
        "LEAD EMAIL SEND ERROR:",
        mailErr?.message || mailErr
      );
    }

    return res.json({
      success: true,
      id: result.insertId,
    });
  } catch (err) {
    console.error("CREATE LEAD ERROR:", err);

    const detail =
      err && typeof err === "object"
        ? err.sqlMessage || err.message
        : typeof err === "string"
        ? err
        : "";

    return res.status(500).json({
      success: false,
      message:
        detail ||
        "Internal server error (no details). Check API server logs.",
    });
  }
};

/* ======================================================
   GET ALL LEADS
====================================================== */
export const getLeads = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM leads ORDER BY id DESC`
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("GET LEADS ERROR:", err);

    return res.status(500).json({
      success: false,
    });
  }
};

/* ======================================================
   GET SINGLE LEAD
====================================================== */
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT * FROM leads WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("GET LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
    });
  }
};

/* ======================================================
   UPDATE LEAD
====================================================== */
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, email, phone, status } = req.body;

    await pool.execute(
      `UPDATE leads 
       SET name=?, email=?, phone=?, status=? 
       WHERE id=?`,
      [name, email, phone, status, id]
    );

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("UPDATE LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
    });
  }
};

/* ======================================================
   DELETE LEAD
====================================================== */
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      `DELETE FROM leads WHERE id = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (err) {
    console.error("DELETE LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
    });
  }
};