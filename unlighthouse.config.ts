export default {
  site: 'https://www.lavanguardia.com',

  scanner: {
    device: 'mobile',
    maxRoutes: 1,
  },

  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  lighthouseOptions: {
    disableStorageReset: true,
  },

  hooks: {
    async 'puppeteer:before-goto'(page: any) {
      // Pre-navegamos para aceptar el consentimiento ANTES de que
      // Unlighthouse haga su goto. Así las cookies quedan seteadas
      // a nivel de browser y tanto el crawl como Lighthouse las ven.
      await page.goto('https://www.lavanguardia.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const btn = '#didomi-notice-agree-button';
      try {
        await page.waitForSelector(btn, { timeout: 8000, visible: true });
        await page.click(btn);
        await new Promise(r => setTimeout(r, 2000));
      } catch {}
    },
  },
};