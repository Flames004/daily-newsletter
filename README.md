# Daily Newsletter

Send a simple daily news digest to your inbox using NewsAPI and Nodemailer (Gmail).

## Features
- Fetches top headlines from NewsAPI with smart fallbacks:
  - Tries your configured country first, then US, then an "everything" query
  - Small sample fallback to keep the email flowing during API hiccups
- Sends a nicely formatted HTML email via Gmail (Nodemailer)
- Simple .env configuration, Git-ignored by default

## Prerequisites
- Node.js 16+ (Node 18 LTS recommended)
- A NewsAPI API key: https://newsapi.org/
- A Gmail account with an App Password (not your regular password)

## Setup
1) Install dependencies

```powershell
npm install
```

2) Create a .env file next to index.js

```env
# Required
NEWS_API_KEY=your_newsapi_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password   # not your normal password
RECEIVER_EMAIL=recipient@example.com

# Optional (defaults shown)
NEWS_COUNTRY=in         # ISO country code; e.g., in, us, gb
NEWS_CATEGORY=general   # business, technology, sports, health, science, entertainment, general
NEWS_QUERY=technology OR world OR business   # used for the fallback 'everything' search
```

3) Create a Gmail App Password (one-time)
- Go to https://myaccount.google.com/security
- Enable "2-Step Verification"
- Open "App passwords"
- Create a new app password for "Mail" (device can be anything)
- Copy the 16-character value (no spaces) into `EMAIL_PASS` in your .env

## Run it

```powershell
node index.js
```

If everything is set correctly, you should see "✅ Newsletter sent successfully!" in the console.

## How it fetches news
The script tries to get good content without manual tweaking every day:
- Top headlines for NEWS_COUNTRY and NEWS_CATEGORY
- If empty and country != US, it retries top headlines for US
- If still empty, it queries the "everything" endpoint using NEWS_QUERY
- If all fail, it uses a tiny sample list to ensure you still receive an email (useful during setup)

To target India specifically, set:
```env
NEWS_COUNTRY=in
```
If you see no items for India at times, try adjusting:
```env
NEWS_CATEGORY=business
# and/or
NEWS_QUERY=india OR politics OR economy
```

## Email template
The HTML is generated inline in `index.js` (generateNewsletterHTML). You can customize styles or structure there.
- A separate file `templates/emailTemplate.js` exists if you prefer splitting the template; you can import and use it instead.

## Environment variables
| Name            | Required | Default                         | Notes |
|-----------------|----------|---------------------------------|-------|
| NEWS_API_KEY    | yes      | —                               | Get from NewsAPI.org |
| EMAIL_USER      | yes      | —                               | Your Gmail address |
| EMAIL_PASS      | yes      | —                               | Gmail App Password (not regular password) |
| RECEIVER_EMAIL  | yes      | —                               | Where to send the digest |
| NEWS_COUNTRY    | no       | in                              | ISO code: us, in, gb, etc. |
| NEWS_CATEGORY   | no       | general                         | business, technology, sports, health, science, entertainment, general |
| NEWS_QUERY      | no       | technology OR world OR business | Used for the fallback 'everything' search |

## Troubleshooting
- EAUTH 534 Application-specific password required
  - Use an App Password. See steps above. Ensure you pasted the 16 chars without spaces.
- EENVELOPE No recipients defined
  - Set `RECEIVER_EMAIL` in your .env.
- NewsAPI key rejected
  - Check `NEWS_API_KEY` is correct and active. Free keys can have limits by endpoint/time.
- No articles for your country category
  - Try a different `NEWS_CATEGORY` or add a targeted `NEWS_QUERY`.
- Rate limiting / intermittent empties
  - The fallback logic will still send. For strict behavior, you can modify the code to exit if no articles.

## Optional: schedule daily sends
You can schedule this with Windows Task Scheduler or add a cron inside the app.

- Windows Task Scheduler: run `node index.js` daily at your preferred time.
- In-app cron (optional):
  1. Install cron dependency
     ```powershell
     npm install node-cron
     ```
  2. Example usage (replace the IIFE in `index.js`):
     ```js
     import cron from 'node-cron';
     cron.schedule('0 8 * * *', async () => { // every day at 08:00
       try {
         validateEnv();
         const newsData = await fetchTopNews();
         await sendNewsletter(newsData);
       } catch (err) {
         console.error('❌ Error:', err);
       }
     });
     ```

## Security notes
- `.env` is already in `.gitignore`; don’t commit secrets.
- Prefer per-app passwords (Gmail App Passwords) and rotate if leaked.

---