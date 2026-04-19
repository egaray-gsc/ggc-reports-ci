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
      // Seteamos cookies de consentimiento a nivel de browser (CDP).
      // Estas persisten entre páginas/tabs del mismo browser,
      // incluida la que abre Lighthouse.
      await page.setCookie(
        {
          name: 'didomi_token',
          value: 'eyJ1c2VyX2lkIjoiMTlkYTU1OGItOTBlNS02ZGM0LTgzZTEtNDk4NTVlZDc1NzEyIiwiY3JlYXRlZCI6IjIwMjYtMDQtMTlUMTA6NDU6NDguNDMwWiIsInVwZGF0ZWQiOiIyMDI2LTA0LTE5VDEwOjQ1OjQ4LjQzMFoiLCJ2ZXJzaW9uIjpudWxsfQ==',
          domain: '.lavanguardia.com',
          path: '/',
        },
        {
          name: 'didomi_token_v2',
          value: '1',
          domain: '.lavanguardia.com',
          path: '/',
        },
        {
          name: 'euconsent-v2',
          value: 'CQR3X0AQR3X0AAHABBESPBIAAAAAAAAAAAIGAAAAAAAAAACAA.YAAAAAAAAAAA',
          domain: '.lavanguardia.com',
          path: '/',
        },
      );
    },

    async 'puppeteer:after-goto'(page: any) {
      // Esperamos a que el SDK de Didomi esté listo y aceptamos todo
      try {
        await page.waitForFunction(
          () => typeof (window as any).Didomi !== 'undefined',
          { timeout: 10000 }
        );
        await page.evaluate(() => {
          (window as any).Didomi.setUserAgreeToAll();
        });
        // Esperamos a que las cookies se escriban tras el consentimiento
        await new Promise(r => setTimeout(r, 2000));
      } catch {}
    },
  },
};