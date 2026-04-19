export default {
  site: 'https://www.lavanguardia.com',

  scanner: {
    device: 'mobile',
    maxRoutes: 5, // Empezamos con 5 para iterar rápido
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
    async 'puppeteer:before-goto'(page: any) {
      const token = 'eyJ1c2VyX2lkIjoiMTlkYTU1OGItOTBlNS02ZGM0LTgzZTEtNDk4NTVlZDc1NzEyIiwiY3JlYXRlZCI6IjIwMjYtMDQtMTlUMTA6NDU6NDguNDMwWiIsInVwZGF0ZWQiOiIyMDI2LTA0LTE5VDEwOjQ1OjQ4LjQzMFoiLCJ2ZXJzaW9uIjpudWxsfQ==';
      await page.evaluateOnNewDocument((t: string) => {
        try {
          window.localStorage.setItem('didomi_token', t);
        } catch (e) {}
      }, token);
    },

    // Fallback: si el banner sigue apareciendo, lo cerramos tras cargar
    async 'puppeteer:after-goto'(page: any) {
      try {
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 5000 });
        await page.click('#didomi-notice-agree-button');
        // Espera a que Didomi procese el click y oculte el banner
        await new Promise(r => setTimeout(r, 2000));
      } catch {
        // Banner no apareció, perfecto
      }
    },
  },
};