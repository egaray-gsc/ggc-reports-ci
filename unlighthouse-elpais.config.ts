import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(os.tmpdir(), "consent-cookies-elpais.com.json");

export default {
  site: "https://elpais.com",

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
      if (!fs.existsSync(COOKIES_FILE)) return;

      const raw = JSON.parse(fs.readFileSync(COOKIES_FILE, "utf-8"));

      // Limpia sameSite inválido para evitar errores silenciosos de setCookie
      const VALID_SAME_SITE = ["Strict", "Lax", "None"];
      const cookies = raw.map((c: any) => {
        const copy = { ...c };
        if (!VALID_SAME_SITE.includes(copy.sameSite)) {
          copy.sameSite = copy.secure ? "None" : "Lax";
        }
        return copy;
      });

      // Extrae tokens de Didomi para inyectarlos en localStorage
      const didomiCookie = raw.find((c: any) => c.name === "didomi_token");
      const euCookie = raw.find((c: any) => c.name === "euconsent-v2");

      if (didomiCookie || euCookie) {
        await page.evaluateOnNewDocument(
          (didomiVal: string | null, euVal: string | null) => {
            try {
              if (didomiVal) localStorage.setItem("didomi_token", didomiVal);
              if (euVal) localStorage.setItem("euconsent-v2", euVal);
            } catch {}
          },
          didomiCookie?.value ?? null,
          euCookie?.value ?? null,
        );
      }

      try {
        await page.setCookie(...cookies);
      } catch (e: any) {
        if (!e.message?.includes("Target closed")) throw e;
      }
    },
  },
};
