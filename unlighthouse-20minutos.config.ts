import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(
  os.tmpdir(),
  "consent-cookies-20minutos.es.json",
);

export default {
  site: "https://www.20minutos.es",

  scanner: {
    device: "mobile",
    maxRoutes: 50,
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
