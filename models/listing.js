import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  phone: String,
  name: String,
  message: String,
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: String, required: true },
    location: { type: String, required: true },
    description: String,
    images: [String],
    phone: String,

    status: {
      type: String,
      enum: ["available", "reserved", "delivered"],
      default: "available",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    requests: [requestSchema],
  },
  { timestamps: true },
);

const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

export default Listing;
