export default {
  site: 'https://www.lavanguardia.com',

  scanner: {
    device: 'desktop',
  },

  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  hooks: {
    async authenticate(page: any) {
      try {
        await page.goto('https://www.lavanguardia.com', { waitUntil: 'networkidle0' });
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 10_000 });
        await page.click('#didomi-notice-agree-button');
        // Wait for Didomi to persist consent cookies
        await page.waitForTimeout(1_500);
      } catch {
        // Banner not present — continue without accepting
      }
    },
  },
};
