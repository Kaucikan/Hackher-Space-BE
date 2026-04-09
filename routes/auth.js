import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.MONGO_URI,
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  family: 4
});

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

/* ---------------- REGISTER ---------------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (exists.rows.length)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (name,email,password)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [name, email, hashed],
    );

    const user = rows[0];

    const token = jwt.sign({ id: user.id }, "secret");

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- LOGIN ---------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    const user = rows[0];

    if (!user) return res.status(401).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user.id }, "secret");

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- FORGOT PASSWORD ---------------- */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  const user = rows[0];
  if (!user) return res.status(404).json({ error: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000);

  await pool.query("UPDATE users SET otp=$1, otp_expiry=$2 WHERE email=$3", [
    otp,
    Date.now() + 5 * 60 * 1000,
    email,
  ]);

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset OTP",
    html: `<h2>Your OTP</h2><h1>${otp}</h1><p>Valid 5 mins</p>`,
  });

  res.json({ message: "OTP sent" });
});

/* ---------------- VERIFY OTP ---------------- */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  const user = rows[0];

  if (!user || user.otp != otp)
    return res.status(400).json({ error: "Invalid OTP" });

  if (user.otp_expiry < Date.now())
    return res.status(400).json({ error: "OTP expired" });

  res.json({ message: "OTP verified" });
});

/* ---------------- RESET PASSWORD ---------------- */
router.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await pool.query(
    "UPDATE users SET password=$1, otp=NULL, otp_expiry=NULL WHERE email=$2",
    [hashed, email],
  );

  res.json({ message: "Password updated" });
});

/* ---------------- UPDATE PROFILE ---------------- */
router.put("/update-profile/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const { rows } = await pool.query(
      `UPDATE users 
       SET name=$1,email=$2,phone=$3 
       WHERE id=$4 
       RETURNING *`,
      [name, email, phone, req.params.id],
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

export default router;
