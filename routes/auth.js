import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
console.log("AUTH ROUTES LOADED");
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
/* -------------------- FORGOT PASSWORD -------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User Not Found" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      from: `"WasteExchange" <${process.env.EMAIL}>`,
      to: email,
      subject: "Password Reset OTP - WasteExchange",
      html: `
      <div style="font-family:Arial;padding:20px">
        
        <h2 style="color:#16a34a">
          WasteExchange Platform
        </h2>

        <p>Hello ${user.name || "User"},</p>

        <p>
          We received a request to reset your password.
          Use the OTP below to continue:
        </p>

        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:5px;
          margin:20px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP is valid for 
          <b>10 minutes</b>.
        </p>

        <p>
          If you did not request this,
          you can ignore this email.
        </p>

        <hr/>

        <p style="font-size:12px;color:#666">
          WasteExchange — Intelligent Waste Exchange Platform <br/>
          Carbon Tracking • Digital Twin • Marketplace
        </p>

      </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.log("OTP send error:", err);
    res.status(500).json({ error: "OTP Send Failed" });
  }
});

/* -------------------- VERIFY OTP -------------------- */

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User Not Found" });

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ error: "OTP Not Requested" });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ error: "OTP Expired" });

    if (user.otp != otp) return res.status(400).json({ error: "Invalid OTP" });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "OTP Verify Failed" });
  }
});

/* -------------------- RESET PASSWORD -------------------- */

router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User Not Found" });

    if (!user.otp) return res.status(400).json({ error: "Verify OTP First" });

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Reset Failed" });
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
