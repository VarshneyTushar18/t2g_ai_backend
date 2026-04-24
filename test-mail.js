import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to yourself
      subject: "Test Email from Node.js",
      text: "If you received this, Nodemailer is working correctly.",
    });

    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testEmail();