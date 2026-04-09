import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

const router = express.Router();

/* -------------------- MODEL -------------------- */

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    otp: Number,
    otpExpiry: Number,
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

/* -------------------- MAIL -------------------- */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

/* -------------------- REGISTER -------------------- */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be 6+ chars" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "hackherspace",
      { expiresIn: "7d" },
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.log("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- LOGIN -------------------- */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "hackherspace",
      { expiresIn: "7d" },
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      token,
    });
  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- UPDATE PROFILE -------------------- */

router.put("/update-profile/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
    });
  } catch (err) {
    console.log("Profile update error:", err);
    res.status(500).json({ error: "Profile update failed" });
  }
});

export default router;
