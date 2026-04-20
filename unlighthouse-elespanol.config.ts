import fs from "fs";

const COOKIES_FILE = "/tmp/consent-cookies-elespanol.com.json";

export default {
  site: "https://www.elespanol.com",

  scanner: {
    device: "mobile",
    maxRoutes: 1,
  },

  puppeteerOptions: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },

  lighthouseOptions: {
    disableStorageReset: true,
  },

  hooks: {
    async "puppeteer:before-goto"(page: any) {
      // Carga cookies reales capturadas por el script de pre-consentimiento
      if (fs.existsSync(COOKIES_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, "utf-8"));
        try {
          await page.setCookie(...cookies);
        } catch (e: any) {
          if (!e.message?.includes("Target closed")) throw e;
        }
      }
    },
  },
};
