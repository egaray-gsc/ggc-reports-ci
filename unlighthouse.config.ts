export default {
  site: 'https://www.lavanguardia.com',

  scanner: {
    device: 'mobile',
    maxRoutes: 1,
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
      await page.evaluateOnNewDocument(() => {
        // Inyectamos el token en localStorage antes de que cargue el SDK
        const token = {
          status: 'accepted',
          purposes: { enabled: ['cookies', 'advertising_personalization', 'analytics'] },
          vendors: { enabled: ['all'] },
          date: new Date().toISOString(),
          version: 1,
        };
        localStorage.setItem('didomi_token', JSON.stringify(token));

        // Registramos callback para forzar consentimiento cuando el SDK arranque
        (window as any).didomiOnReady = (window as any).didomiOnReady || [];
        (window as any).didomiOnReady.push((Didomi: any) => {
          console.log('Unlighthouse: Forzando consentimiento en el SDK');
          Didomi.setUserConsent(true);
        });
      });
    },

    async 'puppeteer:after-goto'(page: any) {
      // Fallback: si el banner sigue visible, lo cerramos con click
      const consentButtonSelector = '#didomi-notice-agree-button';
      try {
        await page.waitForSelector(consentButtonSelector, { timeout: 3000, visible: true });
        await page.click(consentButtonSelector);
        await page.waitForSelector(consentButtonSelector, { hidden: true, timeout: 3000 });
        console.log('✅ Banner cerrado con click (fallback).');
      } catch {
        console.log('ℹ️ Banner no detectado, bypass por localStorage/cookie funcionó.');
      }
    },
  },
};