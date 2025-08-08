import dotenv from "dotenv";
import nodemailer from "nodemailer";
import axios from "axios";
dotenv.config();

// ✅ 1. Fetch Top News from NewsAPI
async function fetchTopNews() {
  const countryEnv = (process.env.NEWS_COUNTRY || "in").toLowerCase();
  const category = process.env.NEWS_CATEGORY || "general";
  const apiKey = process.env.NEWS_API_KEY;
  const query = process.env.NEWS_QUERY || "technology OR world OR business";

  async function requestTopHeadlines(country) {
    const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${encodeURIComponent(category)}&pageSize=5&apiKey=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    if (data?.status === "error") {
      const msg = `${data?.code || "unknown_error"}: ${data?.message || "NewsAPI error"}`;
      // If the API key is bad, fail fast with guidance
      if ((data?.code || "").toLowerCase().includes("apikey") || /api key/i.test(String(data?.message))) {
        throw new Error(`[news] API key error: ${msg}`);
      }
      console.warn(`[news] top-headlines (${country}) error: ${msg}`);
      return [];
    }
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    return articles.map(a => ({ title: a.title, description: a.description, url: a.url })).filter(x => x.title && x.url);
  }

  async function requestEverything() {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    if (data?.status === "error") {
      const msg = `${data?.code || "unknown_error"}: ${data?.message || "NewsAPI error"}`;
      if ((data?.code || "").toLowerCase().includes("apikey") || /api key/i.test(String(data?.message))) {
        throw new Error(`[news] API key error: ${msg}`);
      }
      console.warn(`[news] everything error: ${msg}`);
      return [];
    }
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    return articles.map(a => ({ title: a.title, description: a.description, url: a.url })).filter(x => x.title && x.url);
  }

  try {
    // Try requested country first
    let items = await requestTopHeadlines(countryEnv);
    if (!items.length && countryEnv !== "us") {
      console.warn(`[news] No articles for country='${countryEnv}'. Retrying with country='us'.`);
      items = await requestTopHeadlines("us");
    }
    if (!items.length) {
      console.warn("[news] No top-headlines found; trying 'everything' search.");
      items = await requestEverything();
    }
    if (items.length) return items;
    throw new Error("No articles from API after retries");
  } catch (e) {
    const status = e?.response?.status;
    const msg = e?.message || e;
    if (String(msg).includes("API key error")) {
      throw new Error("NewsAPI rejected your API key. Check NEWS_API_KEY in .env and ensure the key is active.");
    }
    console.warn("[news] API failed; using fallback sample.", status || msg);
    return [
      { title: "Sample Headline 1", description: "Fallback story.", url: "https://example.com/1" },
      { title: "Sample Headline 2", description: "Fallback story.", url: "https://example.com/2" },
      { title: "Sample Headline 3", description: "Fallback story.", url: "https://example.com/3" }
    ];
  }
}

function validateEnv() {
  const missing = [];
  if (!process.env.EMAIL_USER) missing.push("EMAIL_USER");
  if (!process.env.EMAIL_PASS) missing.push("EMAIL_PASS");
  if (!process.env.RECEIVER_EMAIL) missing.push("RECEIVER_EMAIL");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}. Check your .env file.`);
  }
}

// ✅ 2. Generate HTML Newsletter
function generateNewsletterHTML(newsItems) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
    <h2 style="text-align:center; color: #333;">📰 Your Daily News Digest</h2>
    ${newsItems.map(item => `
      <div style="margin-bottom: 20px; padding: 15px; border-bottom: 1px solid #ddd;">
        <h3 style="margin-bottom: 5px; color: #007BFF;">${item.title}</h3>
        <p style="color: #555;">${item.description || "No description available."}</p>
        <a href="${item.url}" target="_blank" style="color: #FF5722; text-decoration: none;">Read more</a>
      </div>
    `).join('')}
    <p style="text-align:center; font-size: 12px; color: #aaa;">Sent via Daily Newsletter App</p>
  </div>
  `;
}

// ✅ 3. Send Email with Nodemailer
async function sendNewsletter(newsItems) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS  // app password
    }
  });

  const htmlContent = generateNewsletterHTML(newsItems);

  await transporter.sendMail({
    from: `"Daily Digest" <${process.env.EMAIL_USER}>`,
  to: process.env.RECEIVER_EMAIL, // recipient email
    subject: `Your Daily News - ${new Date().toLocaleDateString()}`,
    html: htmlContent
  });

  console.log("✅ Newsletter sent successfully!");
}

// ✅ 4. Run the script
(async () => {
  try {
    validateEnv();
    const newsData = await fetchTopNews();
    await sendNewsletter(newsData);
  } catch (error) {
    // Helpful guidance for common cases
    if (String(error?.message || "").includes("Missing required env vars") || String(error?.message || "").includes("No recipients defined")) {
      console.error("❌ Recipient email not set. Add RECEIVER_EMAIL=you@example.com to your .env.");
      return;
    }
    if (error && error.code === "EAUTH" && /Application-specific password required/i.test(String(error.response))) {
      console.error("❌ Gmail rejected the login. Use a Google App Password (not your regular password).");
      console.error("   1) Visit https://myaccount.google.com/security");
      console.error("   2) Enable 2-Step Verification");
      console.error("   3) Create an App Password for 'Mail' on 'Windows Computer' (or similar)");
      console.error("   4) Set EMAIL_PASS in your .env to that 16-character value (no spaces)");
      return;
    }
    console.error("❌ Error:", error);
  }
})();
