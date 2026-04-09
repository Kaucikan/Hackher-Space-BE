import mongoose from "mongoose";

const twinSchema = new mongoose.Schema(
  {
    material: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "available",
    },
  },
  { timestamps: true },
);

const Twin = mongoose.models.Twin || mongoose.model("Twin", twinSchema);

export default Twin;
