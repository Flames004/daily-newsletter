import dotenv from "dotenv";
dotenv.config();

export default {
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  EMAIL_USER: process.env.EMAIL_USER,      // Your Gmail
  EMAIL_PASS: process.env.EMAIL_PASS,      // App password
  RECEIVER_EMAIL: process.env.RECEIVER_EMAIL
};
