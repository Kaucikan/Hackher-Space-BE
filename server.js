import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";

const app = express();

/* -------------------- MIDDLEWARE -------------------- */

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);

/* -------------------- DIGITAL TWIN MODEL -------------------- */

const twinSchema = new mongoose.Schema(
  {
    material: String,
    quantity: Number,
    location: String,
    status: String,
  },
  { timestamps: true },
);

const Twin = mongoose.model("Twin", twinSchema);

/* -------------------- DIGITAL TWIN GET -------------------- */

app.get("/api/digital-twin", async (req, res) => {
  try {
    const data = await Twin.find().lean();

    const result = data.map((item) => {
      let prediction;

      if (item.quantity > 50) {
        prediction = "High waste → Sell or reuse";
      } else if (item.quantity > 20) {
        prediction = "Moderate waste → Recycle";
      } else {
        prediction = "Low waste → Sustainable usage";
      }

      return {
        ...item,
        prediction,
      };
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
    const twin = await Twin.create(req.body);
    res.json(twin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add data" });
  }
});

/* -------------------- IMPACT DATA -------------------- */

app.get("/api/impact/:userId", async (req, res) => {
  try {
    res.json([
      { name: "Jan", co2: 20, waste: 10 },
      { name: "Feb", co2: 30, waste: 15 },
      { name: "Mar", co2: 25, waste: 12 },
      { name: "Apr", co2: 40, waste: 20 },
    ]);
  } catch {
    res.status(500).json({ error: "Failed to load impact data" });
  }
});

/* -------------------- STATS -------------------- */

app.get("/api/stats/:userId", async (req, res) => {
  try {
    res.json({
      wasteListed: 120,
      wasteReused: 80,
      earnings: 2500,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load stats" });
  }
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

  if (carbon > 100) {
    suggestion = "High emission → Reduce usage";
  } else if (carbon > 50) {
    suggestion = "Moderate emission → Optimize";
  } else {
    suggestion = "Low emission → Sustainable";
  }

  res.json({
    total_carbon: Number(carbon.toFixed(2)),
    suggestion,
  });
});

/* -------------------- SEED DATA -------------------- */

app.get("/api/seed", async (req, res) => {
  try {
    await Twin.deleteMany();

    await Twin.insertMany([
      {
        material: "Plastic",
        quantity: 60,
        location: "Chennai",
        status: "available",
      },
      {
        material: "Metal",
        quantity: 30,
        location: "Salem",
        status: "processing",
      },
      {
        material: "Paper",
        quantity: 10,
        location: "Coimbatore",
        status: "reused",
      },
    ]);

    res.send("Sample data inserted");
  } catch (err) {
    res.status(500).json({ error: "Seed failed" });
  }
});

/* -------------------- DATABASE -------------------- */

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "waste_exchange",
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
