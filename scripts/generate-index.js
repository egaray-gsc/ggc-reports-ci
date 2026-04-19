#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const OUTPUT_FILE = path.join(__dirname, '..', 'index.html');

function getReports() {
  const groups = {};

  if (!fs.existsSync(REPORTS_DIR)) return groups;

  const domains = fs.readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const domain of domains) {
    const domainPath = path.join(REPORTS_DIR, domain.name);
    const timestamps = fs.readdirSync(domainPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
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

  let reportSections = '';

  if (!hasReports) {
    reportSections = `
      <p class="empty">No hay reports todavía. Lanza una auditoría desde GitHub Actions.</p>`;
  } else {
    for (const domain of domainNames) {
      const items = groups[domain]
        .map(ts => `        <li><a href="reports/${domain}/${ts}/index.html">&rarr; ${ts}</a></li>`)
        .join('\n');

      reportSections += `
      <section>
        <h2>${domain}</h2>
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
  <style>
    :root {
      --bg: #fafafa;
      --fg: #1a1a1a;
      --muted: #666;
      --border: #e0e0e0;
      --link: #0969da;
      --hover-bg: #f0f0f0;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117;
        --fg: #e6edf3;
        --muted: #8b949e;
        --border: #30363d;
        --link: #58a6ff;
        --hover-bg: #161b22;
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--fg);
      max-width: 640px;
      margin: 0 auto;
      padding: 2rem 1rem;
      line-height: 1.6;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: var(--muted);
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid var(--border);
    }

    section { margin-bottom: 2rem; }

    ul { list-style: none; }

    li {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 0.875rem;
    }

    li a {
      display: block;
      padding: 0.35rem 0.5rem;
      color: var(--link);
      text-decoration: none;
      border-radius: 4px;
    }

    li a:hover {
      background: var(--hover-bg);
      text-decoration: underline;
    }

    .empty {
      color: var(--muted);
      font-style: italic;
      margin-top: 1rem;
    }
  </style>
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
fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

const count = Object.values(groups).reduce((sum, ts) => sum + ts.length, 0);
console.log(`index.html generated — ${Object.keys(groups).length} domain(s), ${count} report(s)`);
