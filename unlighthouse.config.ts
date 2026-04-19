export default {
  site: 'https://www.lavanguardia.com',

  scanner: {
    device: 'mobile',
    maxRoutes: 1,
  },

  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  // Evita que Lighthouse borre cookies/storage antes de auditar,
  // así conserva el consentimiento aceptado en la fase de crawling.
  lighthouseOptions: {
    disableStorageReset: true,
  },

  hooks: {
    async 'puppeteer:after-goto'(page: any) {
      const consentButtonSelector = '#didomi-notice-agree-button';
      try {
        await page.waitForSelector(consentButtonSelector, { timeout: 5000, visible: true });
        await page.click(consentButtonSelector);
        await page.waitForSelector(consentButtonSelector, { hidden: true, timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));
        console.log('✅ Consentimiento aceptado, terceros cargados.');
      } catch {
        console.log('ℹ️ Banner no detectado o ya aceptado.');
      }
    },
  },
};