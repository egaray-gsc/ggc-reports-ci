#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REPORTS_DIR = path.join(__dirname, "..", "reports");
const OUTPUT_FILE = path.join(__dirname, "..", "index.html");

function getReports() {
  const groups = {};

  if (!fs.existsSync(REPORTS_DIR)) return groups;

  const domains = fs
    .readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const domain of domains) {
    const domainPath = path.join(REPORTS_DIR, domain.name);
    const timestamps = fs
      .readdirSync(domainPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
      .reverse();

    if (timestamps.length > 0) {
      groups[domain.name] = timestamps;
    }
  }

  return groups;
}

function buildHTML(groups) {
  const domainNames = Object.keys(groups).sort();
  const hasReports = domainNames.length > 0;

  let reportSections = "";

  if (!hasReports) {
    reportSections = `
      <p class="empty">No hay reports todavía. Lanza una auditoría desde GitHub Actions.</p>`;
  } else {
    for (const domain of domainNames) {
      const items = groups[domain]
        .map(
          (ts) =>
            `          <li><a href="reports/${domain}/${ts}/index.html">${ts}</a></li>`,
        )
        .join("\n");

      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

      reportSections += `
      <section>
        <div class="card-header">
          <img src="${faviconUrl}" alt="${domain}" width="24" height="24">
          <h2>${domain}</h2>
        </div>
        <ul>
${items}
        </ul>
      </section>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Lighthouse Reports</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Lighthouse Reports</h1>
    <p class="subtitle">Auditorías generadas con Unlighthouse vía GitHub Actions</p>
  </header>
  <main>${reportSections}
  </main>
</body>
</html>
`;
}

const groups = getReports();
const html = buildHTML(groups);
fs.writeFileSync(OUTPUT_FILE, html, "utf-8");

const count = Object.values(groups).reduce((sum, ts) => sum + ts.length, 0);
console.log(
  `index.html generated — ${Object.keys(groups).length} domain(s), ${count} report(s)`,
);
