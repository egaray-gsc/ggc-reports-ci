#!/usr/bin/env node
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch {
  console.error('Puppeteer no encontrado. Instálalo con: npm install -g puppeteer');
  process.exit(1);
}
const fs = require('fs');
const path = require('path');

const SITE = process.argv[2] || 'https://www.lavanguardia.com';
const OUTPUT = process.argv[3] || '/tmp/consent-cookies.json';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36');
  await page.goto(SITE, { waitUntil: 'networkidle2', timeout: 30000 });

  const btn = '#didomi-notice-agree-button';
  try {
    await page.waitForSelector(btn, { timeout: 15000, visible: true });
    await page.click(btn);
    await new Promise(r => setTimeout(r, 3000));
    console.log('✅ Consentimiento aceptado');
  } catch {
    // Intentar dentro del iframe de Didomi
    try {
      const frames = page.frames();
      for (const frame of frames) {
        const button = await frame.$(btn);
        if (button) {
          await button.click();
          await new Promise(r => setTimeout(r, 3000));
          console.log('✅ Consentimiento aceptado (iframe)');
          break;
        }
      }
    } catch {
      console.log('⚠️ Banner no detectado');
    }
  }

  const cookies = await page.cookies();
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(cookies, null, 2));
  console.log(`✅ ${cookies.length} cookies guardadas en ${OUTPUT}`);

  await browser.close();
})();
