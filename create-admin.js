import bcrypt from "bcryptjs";
import pool from "./src/config/db.js";

const run = async () => {
  try {
    const hash = await bcrypt.hash("admin123", 10);

    await pool.execute(
      "INSERT INTO admins (email, password) VALUES (?, ?)",
      ["admin@gmail.com", hash]
    );

    console.log("✅ Admin created successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

run();