import pool from "../config/db.js";
import { createTransporter } from "../utils/email.service.js";

/* ======================================================
   CREATE LEAD
====================================================== */
export const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      aiProduct,
      message,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()){
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ Create transporter at runtime (FIX)
    const transporter = createTransporter();

    // ✅ Save to DB
    const [result] = await pool.execute(
      `INSERT INTO leads 
      (name, email, phone, company, ai_product, message)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, company, aiProduct, message]
    );

    // ✅ Send emails
    await Promise.all([
      transporter.sendMail({
        from: `"Contact Form" <${process.env.EMAIL_USER}>`,
        replyTo: email,
        to: process.env.EMAIL_USER,
        subject: `New AI Lead: ${aiProduct} | ${name}`,
        html: `
          <h3>New Enquiry</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Company:</strong> ${company || "N/A"}</p>
          <p><strong>AI Product:</strong> ${aiProduct || "N/A"}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
      }),

      transporter.sendMail({
        from: `"Tech2Globe" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "We’ve received your enquiry",
        html: `
          Dear ${name},<br><br>
          Thank you for contacting us.<br>
          Our team will review your request and get back to you shortly.<br><br>

          Regards,<br>
          <b>Team Tech2Globe</b>
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
    const [rows] = await pool.execute(
      `SELECT * FROM leads ORDER BY id DESC`
    );

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
      [name, email, phone, status, id]
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
    return res.status(500).json({ success: false });
  }
};