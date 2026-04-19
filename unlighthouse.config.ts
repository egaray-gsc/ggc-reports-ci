export default {
  site: 'https://www.lavanguardia.com',

  scanner: {
    device: 'mobile',
    maxRoutes: 5,
  },

  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  cookies: [
    {
      name: 'didomi_token',
      value: 'eyJ1c2VyX2lkIjoiMTlkYTU1OGItOTBlNS02ZGM0LTgzZTEtNDk4NTVlZDc1NzEyIiwiY3JlYXRlZCI6IjIwMjYtMDQtMTlUMTA6NDU6NDguNDMwWiIsInVwZGF0ZWQiOiIyMDI2LTA0LTE5VDEwOjQ1OjQ4LjQzMFoiLCJ2ZXJzaW9uIjpudWxsfQ==',
      domain: '.lavanguardia.com',
      path: '/',
    },
  ],

  hooks: {
    // Fallback: click en el banner si aparece tras cargar la página
    async 'puppeteer:after-goto'(page: any) {
      try {
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 5000 });
        await page.click('#didomi-notice-agree-button');
        await new Promise(r => setTimeout(r, 2000));
      } catch {
        // Banner no apareció
      }
    },
  },
};