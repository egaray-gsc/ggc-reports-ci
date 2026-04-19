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
    async 'puppeteer:before-goto'(page: any) {
      // Opcional: Podrías inyectar cookies de consentimiento aquí 
      // si prefieres no interactuar con el DOM.
    },

    async 'puppeteer:after-goto'(page: any) {
      const consentButtonSelector = '#didomi-notice-agree-button';
      
      try {
        // Esperamos a que el selector esté presente y sea visible
        await page.waitForSelector(consentButtonSelector, { 
          timeout: 5000, 
          visible: true 
        });
        
        // Hacemos click en el botón de aceptar
        await page.click(consentButtonSelector);
        
        // Esperamos a que el banner desaparezca del DOM para evitar 
        // que bloquee elementos en las capturas de Lighthouse
        await page.waitForSelector(consentButtonSelector, { 
          hidden: true, 
          timeout: 5000 
        });

        // Opcional: Pequeño delay extra para asegurar que las animaciones de salida terminen
        await new Promise(r => setTimeout(r, 1000));
        
        console.log('✅ Consentimiento aceptado correctamente.');
      } catch (e) {
        // El banner no apareció o ya estaba aceptado (por cookies persistentes)
        console.log('ℹ️ No se detectó banner de consentimiento o ya fue aceptado.');
      }
    },
  },
};