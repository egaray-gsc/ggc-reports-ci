#!/usr/bin/env node

const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "..", "index.html");

const {
  R2_BUCKET,
  R2_ENDPOINT,
  R2_BASE_URL,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
} = process.env;

if (!R2_BUCKET || !R2_ENDPOINT || !R2_BASE_URL || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing required env vars: R2_BUCKET, R2_ENDPOINT, R2_BASE_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function listAllObjects() {
  const objects = [];
  let continuationToken;

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      ContinuationToken: continuationToken,
    });
    const response = await client.send(command);
    if (response.Contents) objects.push(...response.Contents);
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

function getReports(objects) {
  const groups = {};

  for (const obj of objects) {
    const match = obj.Key.match(/^([^/]+)\/([^/]+)\/index\.html$/);
    if (!match) continue;
    const [, domain, timestamp] = match;
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(timestamp);
  }

  for (const domain of Object.keys(groups)) {
    groups[domain].sort().reverse();
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
            `          <li><a href="${R2_BASE_URL}/${domain}/${ts}/index.html">${ts}</a></li>`,
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

(async () => {
  const objects = await listAllObjects();
  const groups = getReports(objects);
  const html = buildHTML(groups);
  fs.writeFileSync(OUTPUT_FILE, html, "utf-8");

  const count = Object.values(groups).reduce((sum, ts) => sum + ts.length, 0);
  console.log(
    `index.html generated — ${Object.keys(groups).length} domain(s), ${count} report(s)`,
  );
})();
