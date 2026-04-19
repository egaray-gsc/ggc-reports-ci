import fs from 'fs';

const COOKIES_FILE = '/tmp/consent-cookies.json';

export default {
  site: 'https://www.lavanguardia.com',

  scanner: {
    device: 'mobile',
    maxRoutes: 50,
  },

  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  lighthouseOptions: {
    disableStorageReset: true,
  },

  hooks: {
    async 'puppeteer:before-goto'(page: any) {
      // Carga cookies reales capturadas por el script de pre-consentimiento
      if (fs.existsSync(COOKIES_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
        await page.setCookie(...cookies);
      }
    },
  },
};