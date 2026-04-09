import express from "express";
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

/* -------------------- GET ALL -------------------- */

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM listings ORDER BY created_at DESC",
    );

    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to load listings" });
  }
});

/* -------------------- CREATE -------------------- */

router.post("/", async (req, res) => {
  try {
    const { title, material, quantity, location, price, description, userId } =
      req.body;

    const { rows } = await pool.query(
      `INSERT INTO listings 
      (title, material, quantity, location, price, description, user_id, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'available')
      RETURNING *`,
      [title, material, quantity, location, price, description, userId],
    );

    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to create listing" });
  }
});

/* -------------------- REQUEST -------------------- */

router.post("/:id/request", async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO requests 
      (listing_id, name, phone, message, status)
      VALUES ($1,$2,$3,$4,'pending')
      RETURNING *`,
      [
        req.params.id,
        name || "Anonymous",
        phone || "N/A",
        message || "Interested",
      ],
    );

    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Request failed" });
  }
});

/* -------------------- USER LISTINGS -------------------- */

router.get("/user/:userId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM listings WHERE user_id=$1",
      [req.params.userId],
    );

    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to load listings" });
  }
});

/* -------------------- UPDATE -------------------- */

router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const { rows } = await pool.query(
      "UPDATE listings SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id],
    );

    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

/* -------------------- DELETE -------------------- */

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM listings WHERE id=$1", [req.params.id]);

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
