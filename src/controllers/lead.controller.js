import pool from "../config/db.js";
import axios from "axios";
import { createTransporter } from "../utils/email.service.js";

const LEAD_EMAILS = ["info@tech2globe.com", "enquiries@tech2globe.net"];

export const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, aiProduct, message, source_page } =
      req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ================= CLIENT IP =================

    const ip =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    // ================= LOCATION LOOKUP =================

    let location = "Unknown";

    try {
      const geoResponse = await axios.get(`https://ipapi.co/${ip}/json/`);

      const geo = geoResponse.data;

      location = `${geo.city || "-"}, ${geo.region || "-"}, ${geo.country_name || "-"}`;
    } catch (error) {
      console.log("Geo lookup failed:", error.message);
    }

    // ================= MAILER =================

    const transporter = createTransporter();

    // ================= SAVE TO DB =================

    const [result] = await pool.execute(
      `INSERT INTO leads 
      (name, email, phone, company, ai_product, message)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, company, aiProduct, message],
    );

    // ================= SEND EMAILS =================

    await Promise.all([
      transporter.sendMail({
        from: `"Contact Form" <${process.env.SMTP_EMAIL}>`,
        replyTo: email,
        to: LEAD_EMAILS.join(","),

        subject: `New AI Lead: ${aiProduct} | ${name}`,

        html: `
        <div style="background:#f4f4f4;padding:40px 20px;font-family:Arial,sans-serif;">

          <div style="max-width:700px;margin:auto;background:#ffffff;border-radius:10px;padding:35px;">

            <h2 style="margin-top:0;color:#111;">
              New AI Lead Received
            </h2>

            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />

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

            <p><strong>Location:</strong> ${location}</p>

            <p><strong>Sender IP:</strong> ${ip}</p>

            <hr style="border:none;border-top:1px solid #e5e5e5;margin:25px 0;" />

            <h3 style="margin-bottom:15px;color:#222;">
              Message
            </h3>

            <p style="line-height:1.7;">
              ${message || "-"}
            </p>

            <hr style="border:none;border-top:1px solid #e5e5e5;margin:25px 0;" />

            <h3 style="margin-bottom:15px;color:#222;">
              Additional Information
            </h3>
<p>
  <strong>Source Page:</strong>
  ${source_page ? `<a href="${source_page}">${source_page}</a>` : "-"}
</p>

            <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>

          </div>

        </div>
        `,
      }),

      transporter.sendMail({
        from: `"Tech2Globe" <${process.env.SMTP_EMAIL}>`,
        to: email,

        subject: "We’ve received your enquiry",

        html: `
        <div style="background:#f4f4f4;padding:40px 20px;font-family:Arial,sans-serif;">

          <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:10px;padding:35px;">

            <h2 style="margin-top:0;color:#111;">
              Thank You for Contacting Us
            </h2>

            <p>
              Dear ${name},
            </p>

            <p style="line-height:1.7;">
              Thank you for contacting Tech2Globe.
              Our team has received your enquiry and will get back to you shortly.
            </p>

            <hr style="border:none;border-top:1px solid #e5e5e5;margin:25px 0;" />

            <h3>Your Submitted Details</h3>

            <p><strong>Name:</strong> ${name}</p>

            <p><strong>Email:</strong> ${email}</p>

            <p><strong>Phone:</strong> ${phone || "-"}</p>

            <p><strong>Company:</strong> ${company || "-"}</p>

            <p><strong>AI Product:</strong> ${aiProduct || "-"}</p>

            <hr style="border:none;border-top:1px solid #e5e5e5;margin:25px 0;" />

            <p>
              Regards,<br />
              <strong>Team Tech2Globe</strong>
            </p>

          </div>

        </div>
        `,
      }),
    ]);

    return res.json({
      success: true,
      id: result.insertId,
    });
  } catch (err) {
    console.error("CREATE LEAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* ======================================================
   GET ALL LEADS (Admin)
====================================================== */
export const getLeads = async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM leads ORDER BY id DESC`);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("GET LEADS ERROR:", err);
    return res.status(500).json({ success: false });
  }
};

/* ======================================================
   GET SINGLE LEAD
====================================================== */
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`SELECT * FROM leads WHERE id = ?`, [id]);

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
    return res.status(500).json({ success: false });
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
      [name, email, phone, status, id],
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("UPDATE LEAD ERROR:", err);
    return res.status(500).json({ success: false });
  }
};

/* ======================================================
   DELETE LEAD (Admin)
====================================================== */
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(`DELETE FROM leads WHERE id = ?`, [id]);

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
    return res.status(500).json({ success: false });
  }
};
