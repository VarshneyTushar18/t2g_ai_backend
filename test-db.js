import pool from "./src/config/db.js";

const test = async () => {
  try {
    const [rows] = await pool.execute("SELECT 1");
    console.log("✅ DB Connected");
    process.exit();
  } catch (err) {
    console.error("❌ DB Error:", err);
    process.exit(1);
  }
};

test();