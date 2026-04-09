import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";

import Twin from "./models/Twin.js";
import Carbon from "./models/Carbon.js";

const app = express();

/* -------------------- DB -------------------- */

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI missing in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo error", err));

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);


/* -------------------- DIGITAL TWIN -------------------- */

app.get("/api/digital-twin", async (req, res) => {
  try {
    const data = await Twin.find({}).lean();
    return res.json(data || []);
  } catch (err) {
    console.error("Twin GET error:", err);
    return res.json([]); // never send 500
  }
});

app.post("/api/digital-twin", async (req, res) => {
  try {
    const twin = new Twin({
      material: req.body?.material || "",
      quantity: Number(req.body?.quantity || 0),
      location: req.body?.location || "",
      status: req.body?.status || "available",
    });

    await twin.save();

    res.json(twin);
  } catch (err) {
    console.error("Twin POST error:", err);
    res.json({ error: "save failed" });
  }
});

/* -------------------- CARBON -------------------- */

app.post("/api/carbon", async (req, res) => {
  try {
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

    const suggestion =
      carbon > 100
        ? "High emission → Reduce usage"
        : carbon > 50
          ? "Moderate emission → Optimize"
          : "Low emission → Sustainable";

    const saved = await Carbon.create({
      type,
      transport,
      electricity,
      waste,
      industryEnergy,
      total_carbon: carbon,
    });

    res.json({
      total_carbon: Number(carbon.toFixed(2)),
      suggestion,
      data: saved,
    });
  } catch (err) {
    console.log("Carbon error:", err);
    res.status(500).json({ error: "carbon failed" });
  }
});

/* -------------------- IMPACT -------------------- */

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

/* -------------------- HEALTH -------------------- */

app.get("/", (req, res) => {
  res.send("HackHerSpace API running");
});

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
