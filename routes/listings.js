import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/* -------------------- MODEL -------------------- */

const listingSchema = new mongoose.Schema(
  {
    title: String,
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

    /* FIX: add requests */
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

/* FIX: prevent overwrite */
const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

/* -------------------- GET ALL -------------------- */

router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch {
    res.status(500).json({ error: "Failed to load listings" });
  }
});

/* -------------------- CREATE -------------------- */

router.post("/", async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.json(listing);
  } catch {
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

    res.json({ success: true, requests: listing.requests });
  } catch {
    res.status(500).json({ error: "Request failed" });
  }
});

/* -------------------- USER LISTINGS -------------------- */

router.get("/user/:userId", async (req, res) => {
  try {
    /* FIX: use userId not owner */
    const listings = await Listing.find({
      userId: req.params.userId,
    });

    res.json(listings);
  } catch {
    res.status(500).json({ error: "Failed to load listings" });
  }
});

/* -------------------- UPDATE STATUS -------------------- */

router.put("/:id", async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(listing);
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

/* -------------------- DELETE -------------------- */

router.delete("/:id", async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
