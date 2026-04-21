import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(os.tmpdir(), "consent-cookies-as.com.json");

export default {
  site: "https://as.com",

  scanner: {
    device: "mobile",
    maxRoutes: 2,
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

    async "puppeteer:after-goto"(page: any) {
      const SELECTORS = [
        'astro-island[props*="acceptAll"] button',
        'button[onclick*="acceptConsentWall"]',
        ".pmConsentWall-button",
      ];

      // Esperar a que el Astro island se hidrate (puede tardar unos segundos)
      for (const selector of SELECTORS) {
        try {
          await page.waitForSelector(selector, {
            timeout: 8000,
            visible: true,
          });
          await page.click(selector);
          await new Promise((r: any) => setTimeout(r, 2000));
          break;
        } catch {
          // siguiente selector
        }
      }

      // También intentar dentro de iframes
      for (const frame of page.frames()) {
        for (const selector of SELECTORS) {
          try {
            const btn = await frame.$(selector);
            if (btn) {
              await btn.click();
              await new Promise((r: any) => setTimeout(r, 2000));
              return;
            }
          } catch {
            // continuar
          }
        }
      }
    },
  },
};
