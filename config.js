import dotenv from "dotenv";
dotenv.config();

export default {
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  EMAIL_USER: process.env.EMAIL_USER,      // Your Gmail
  EMAIL_PASS: process.env.EMAIL_PASS,      // App password
  RECEIVER_EMAIL: process.env.RECEIVER_EMAIL,
  // Optional: set DRY_RUN=true to avoid sending and log the message instead
  DRY_RUN: process.env.DRY_RUN || "false",
  // Optional: set USE_ETHEREAL=true to send via Ethereal test SMTP and get a preview URL
  USE_ETHEREAL: process.env.USE_ETHEREAL || "false"
};
