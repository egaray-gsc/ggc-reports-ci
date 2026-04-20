#!/usr/bin/env node
let puppeteer;
try {
  puppeteer = require("puppeteer");
} catch {
  console.error(
    "Puppeteer no encontrado. Instálalo con: npm install -g puppeteer",
  );
  process.exit(1);
}
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const SITE = process.argv[2] || "https://www.lavanguardia.com";
const domain = new URL(SITE).hostname.replace(/^www\./, "");
const OUTPUT = process.argv[3] || `/tmp/consent-cookies-${domain}.json`;

// Selectores de botón de aceptación para distintos CMPs
const CONSENT_SELECTORS = [
  "#didomi-notice-agree-button", // Didomi
  "#onetrust-accept-btn-handler", // OneTrust
  ".fc-cta-consent", // Funding Choices (Google)
  '[data-testid="GDPR-accept"]', // custom
  "button.sp_choice_type_11", // Sourcepoint
  "#acceptAll", // genérico
  'button[id*="accept"], button[class*="accept-all"]', // genérico
];

async function tryAcceptConsent(page) {
  for (const selector of CONSENT_SELECTORS) {
    try {
      await page.waitForSelector(selector, { timeout: 5000, visible: true });
      await page.click(selector);
      await new Promise((r) => setTimeout(r, 3000));
      console.log(`✅ Consentimiento aceptado (${selector})`);
      return true;
    } catch {
      // selector no encontrado, probar el siguiente
    }
  }
  return false;
}

async function tryAcceptConsentInFrames(page) {
  const frames = page.frames();
  for (const frame of frames) {
    for (const selector of CONSENT_SELECTORS) {
      try {
        const button = await frame.$(selector);
        if (button) {
          await button.click();
          await new Promise((r) => setTimeout(r, 3000));
          console.log(`✅ Consentimiento aceptado en iframe (${selector})`);
          return true;
        }
      } catch {
        // continuar
      }
    }
  }
  return false;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  );
  await page.goto(SITE, { waitUntil: "networkidle2", timeout: 30000 });

  const accepted =
    (await tryAcceptConsent(page)) || (await tryAcceptConsentInFrames(page));
  if (!accepted) {
    console.log("⚠️ Banner de consentimiento no detectado");
  }

  const cookies = await page.cookies();
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(cookies, null, 2));
  console.log(`✅ ${cookies.length} cookies guardadas en ${OUTPUT}`);

  await browser.close();
})();
