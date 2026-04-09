import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,

  otp: String,
  otpExpiry: Date,
});

export default mongoose.model("User", userSchema);
