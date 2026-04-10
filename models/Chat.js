import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  question: String,
  answer: String,
  keywords: [String],
});

export default mongoose.model("Chat", chatSchema);
