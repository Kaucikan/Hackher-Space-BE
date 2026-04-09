import mongoose from "mongoose";

const carbonSchema = new mongoose.Schema(
  {
    type: String,
    transport: Number,
    electricity: Number,
    waste: Number,
    industryEnergy: Number,
    total_carbon: Number,
  },
  { timestamps: true },
);

const Carbon = mongoose.models.Carbon || mongoose.model("Carbon", carbonSchema);

export default Carbon;
