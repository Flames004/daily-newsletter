import axios from "axios";
import nodemailer from "nodemailer";
import config from "./config.js";
import emailTemplate from "./templates/emailTemplate.js";

async function getNews() {
  const url = `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${config.NEWS_API_KEY}`;
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const arts = Array.isArray(res?.data?.articles) ? res.data.articles : [];
    const items = arts.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url
    }));
    if (items.length) return items;
    console.warn("[news] No articles from API; using fallback sample.");
  } catch (e) {
    console.warn("[news] API failed; using fallback sample.", e?.response?.status || e?.code || e?.message || e);
  }
  return [
    { title: "Sample Headline 1", description: "Fallback story.", url: "https://example.com/1" },
    { title: "Sample Headline 2", description: "Fallback story.", url: "https://example.com/2" },
    { title: "Sample Headline 3", description: "Fallback story.", url: "https://example.com/3" }
  ];
}

async function sendEmail(content) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Daily News Bot" <${config.EMAIL_USER}>`,
    to: config.RECEIVER_EMAIL,
    subject: "📰 Your Daily News Update",
    html: content
  });

  console.log("✅ Email sent!");
}

(async () => {
  try {
    const news = await getNews();
    const html = emailTemplate(news);
    await sendEmail(html);
  } catch (err) {
    // Improve guidance for common Gmail errors
    if (err && err.code === "EAUTH" && /Application-specific password required/i.test(String(err.response))) {
      console.error("❌ Gmail rejected the login. If your account has 2-Step Verification, you must use an App Password.");
      console.error("   1) Visit https://myaccount.google.com/security");
      console.error("   2) Enable 2-Step Verification");
      console.error("   3) Create an App Password for 'Mail' on 'Windows Computer' (or similar)");
      console.error("   4) Put it in your .env as EMAIL_PASS=xxxx xxxx xxxx xxxx");
    } else {
      console.error("❌ Error:", err);
    }
  }
})();
