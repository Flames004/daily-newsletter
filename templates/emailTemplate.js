export default function emailTemplate(articles) {
  return `
  <h2>📰 Daily Trending News</h2>
  <p>Here’s your quick news digest for today:</p>
  <ul>
    ${articles.map(a => `
      <li>
        <strong>${a.title}</strong><br>
        ${a.description || "No description"}<br>
        <a href="${a.url}">Read more</a>
      </li>
    `).join("")}
  </ul>
  <p>— Your Daily News Bot</p>
  `;
}
