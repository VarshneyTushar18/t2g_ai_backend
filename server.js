import dotenv from "dotenv";
dotenv.config(); // 🔥 MUST BE FIRST LINE (before ANY import)

import app from "./src/app.js";

const PORT = process.env.PORT || 5002;


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});