import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🔍 Debug (temporary - remove later)
    console.log("AUTH HEADER:", authHeader);

    // 🔒 Validate header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid token",
      });
    }

    const token = authHeader.split(" ")[1];

    // 🔍 Debug token
    console.log("TOKEN:", token);

    // 🔒 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 Debug decoded
    console.log("DECODED:", decoded);

    // Attach admin
    req.admin = {
      id: decoded.id,
      email: decoded.email,
    };

    next();

  } catch (err) {
    console.error("JWT ERROR:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};