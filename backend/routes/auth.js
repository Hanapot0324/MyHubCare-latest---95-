// backend/routes/auth.js
import express from "express";
import bcrypt from 'bcryptjs';
import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = "supersecretkey"; // change this

// POST /api/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Find user
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND status = 'active'",
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ success: false, message: "User not found" });

    const user = rows[0];

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid password" });

    // 3. Only allow ‘patient’ role for mobile/web login
    if (user.role !== "patient")
      return res.status(403).json({ success: false, message: "Access denied. Patients only." });

    // 4. Generate session token
    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // 5. Store session
    const session_id = uuidv4();
    const token_hash = await bcrypt.hash(token, 10);
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      `INSERT INTO auth_sessions 
        (session_id, user_id, token_hash, expires_at, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session_id,
        user.user_id,
        token_hash,
        expires_at,
        req.ip,
        req.headers["user-agent"],
      ]
    );

    // 6. Update last_login
    await db.query("UPDATE users SET last_login = NOW() WHERE user_id = ?", [user.user_id]);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
