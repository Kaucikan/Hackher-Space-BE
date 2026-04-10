import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  question: String,
  answer: String,
  keywords: [String],
});

const Chat =
  mongoose.models.Chat ||
  mongoose.model("Chat", chatSchema);

export default Chat;
