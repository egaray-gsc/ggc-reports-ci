import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(
  os.tmpdir(),
  "consent-cookies-elespanol.com.json",
);

export default {
  site: "https://www.elespanol.com",

  scanner: {
    device: "mobile",
    maxRoutes: 5,
    exclude: [/^\/$/],
  },

  puppeteerOptions: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },

  lighthouseOptions: {
    disableStorageReset: true,
    throttlingMethod: "provided",
    maxWaitForLoad: 90000,
  },

  hooks: {
    async "puppeteer:before-goto"(page: any) {
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
