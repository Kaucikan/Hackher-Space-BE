import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/* -------------------- MODEL -------------------- */

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    material: String,
    quantity: Number,
    location: String,
    price: Number,
    description: String,
    userId: String,
    status: {
      type: String,
      default: "available",
    },
    requests: [
      {
        name: String,
        phone: String,
        message: String,
        status: {
          type: String,
          default: "pending",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

/* -------------------- GET ALL -------------------- */

router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (err) {
    console.log("GET listings error:", err);
    res.status(500).json({ error: "Failed to load listings" });
  }
});

/* -------------------- CREATE -------------------- */

router.post("/", async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ error: "Title required" });
    }

    const listing = await Listing.create(req.body);

    res.status(201).json(listing);
  } catch (err) {
    console.log("Create listing error:", err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

/* -------------------- REQUEST -------------------- */

router.post("/:id/request", async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    listing.requests.push({
      name: name || "Anonymous",
      phone: phone || "N/A",
      message: message || "Interested",
    });

    await listing.save();

    res.json({
      success: true,
      requests: listing.requests,
    });
  } catch (err) {
    console.log("Request error:", err);
    res.status(500).json({ error: "Request failed" });
  }
});

/* -------------------- USER LISTINGS -------------------- */

router.get("/user/:userId", async (req, res) => {
  try {
    const listings = await Listing.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json(listings);
  } catch (err) {
    console.log("User listings error:", err);
    res.status(500).json({ error: "Failed to load listings" });
  }
});

/* -------------------- UPDATE -------------------- */

router.put("/:id", async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json(listing);
  } catch (err) {
    console.log("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* -------------------- DELETE -------------------- */

router.delete("/:id", async (req, res) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.log("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
