import express from "express";
import Chat from "../models/Chat.js";
import Listing from "../models/Listing.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const message = req.body?.message || "";
    const text = message.toLowerCase();

    /* MARKETPLACE LIST */

    if (
      text.includes("list marketplace") ||
      text.includes("show marketplace") ||
      text.includes("marketplace items") ||
      text.includes("marketplace list")
    ) {
      const listings = await Listing.find().limit(5).lean();

      if (!listings.length) {
        return res.json({ reply: "No marketplace items found." });
      }

      const formatted = listings
        .map((l, i) => {
          const title = l.title || "Material";
          const qty = l.quantity || 0;
          const loc = l.location || "";

          return `${i + 1}. ${title} - ${qty}kg - ${loc}`;
        })
        .join("\n");

      return res.json({
        reply: `Here are marketplace listings:\n${formatted}`,
      });
    }

    /* STATIC AI */

    const chats = await Chat.find().lean();

    let reply = "Ask About Marketplace, Carbon, Or Waste.";

    for (const chat of chats) {
      if (!chat.keywords) continue;

      const match = chat.keywords.some((k) =>
        text.includes(k.toLowerCase())
      );

      if (match) {
        reply = chat.answer;
        break;
      }
    }

    res.json({ reply });
  } catch (err) {
    console.log("CHAT ERROR:", err);

    res.json({
      reply: "AI Server Error. Please Try Again.",
    });
  }
});

export default router;
