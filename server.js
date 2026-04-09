import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import cors from "cors";
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

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";

const app = express();

/* -------------------- MIDDLEWARE -------------------- */

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);

/* -------------------- DIGITAL TWIN GET -------------------- */

app.get("/api/digital-twin", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM twins");

    const result = rows.map((item) => {
      let prediction;

      if (item.quantity > 50) prediction = "High waste → Sell or reuse";
      else if (item.quantity > 20) prediction = "Moderate waste → Recycle";
      else prediction = "Low waste → Sustainable usage";

      return { ...item, prediction };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- DIGITAL TWIN ADD -------------------- */

app.post("/api/digital-twin", async (req, res) => {
  try {
    const { material, quantity, location, status } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO twins (material, quantity, location, status)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [material, quantity, location, status],
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add data" });
  }
});

/* -------------------- IMPACT DATA -------------------- */

app.get("/api/impact/:userId", async (req, res) => {
  res.json([
    { name: "Jan", co2: 20, waste: 10 },
    { name: "Feb", co2: 30, waste: 15 },
    { name: "Mar", co2: 25, waste: 12 },
    { name: "Apr", co2: 40, waste: 20 },
  ]);
});

/* -------------------- STATS -------------------- */

app.get("/api/stats/:userId", async (req, res) => {
  res.json({
    wasteListed: 120,
    wasteReused: 80,
    earnings: 2500,
  });
});

/* -------------------- CARBON CALCULATOR -------------------- */

app.post("/api/carbon", (req, res) => {
  const {
    type,
    transport = 10,
    electricity = 20,
    waste = 15,
    industryEnergy = 0,
  } = req.body;

  let carbon = 0;

  if (type === "individual") {
    carbon = transport * 0.12 + electricity * 0.8 + waste * 0.5;
  }

  if (type === "industry") {
    carbon = industryEnergy * 1.5 + waste * 0.7;
  }

  let suggestion;

  if (carbon > 100) suggestion = "High emission → Reduce usage";
  else if (carbon > 50) suggestion = "Moderate emission → Optimize";
  else suggestion = "Low emission → Sustainable";

  res.json({
    total_carbon: Number(carbon.toFixed(2)),
    suggestion,
  });
});

/* -------------------- SEED DATA -------------------- */

app.get("/api/seed", async (req, res) => {
  try {
    await pool.query("DELETE FROM twins");

    await pool.query(`
      INSERT INTO twins (material, quantity, location, status)
      VALUES 
      ('Plastic',60,'Chennai','available'),
      ('Metal',30,'Salem','processing'),
      ('Paper',10,'Coimbatore','reused')
    `);

    res.send("Sample data inserted");
  } catch (err) {
    res.status(500).json({ error: "Seed failed" });
  }
});

app.get("/db-test", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    res.json(rows);
  } catch (err) {
    res.status(500).json(err.message);
  }
});
console.log("ENV:", process.env.MONGO_URI);
/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
