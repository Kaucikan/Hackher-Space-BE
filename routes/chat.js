import express from "express";
import Chat from "../models/Chat.js";
import Listing from "../models/Listing.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const message = req.body?.message || "";
    const text = message.toLowerCase();

    /* ---------------- MARKETPLACE LIST ---------------- */

    if (
      text.includes("list marketplace") ||
      text.includes("show marketplace") ||
      text.includes("marketplace items") ||
      text.includes("marketplace list")
    ) {
      const listings = await Listing.find().limit(5);

      if (!listings.length) {
        return res.json({ reply: "No marketplace items found." });
      }

      const formatted = listings
        .map((l, i) => `${i + 1}. ${l.title} - ${l.quantity}kg - ₹${l.price}`)
        .join("\n");

      return res.json({
        reply: `Here are marketplace listings:\n${formatted}`,
      });
    }

    /* ---------------- STATIC AI ---------------- */

    const chats = await Chat.find();

    let reply = "Ask about marketplace, carbon, or waste.";

    for (const chat of chats) {
      if (!chat.keywords) continue;

      const match = chat.keywords.some((k) => text.includes(k.toLowerCase()));

      if (match) {
        reply = chat.answer;
        break;
      }
    }

    res.json({ reply });
  } catch (err) {
    console.log("CHAT ERROR:", err);
    res.json({ reply: "AI server error" });
  }
});

export default router;
