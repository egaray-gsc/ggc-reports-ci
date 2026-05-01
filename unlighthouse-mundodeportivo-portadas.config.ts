import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(
  os.tmpdir(),
  "consent-cookies-mundodeportivo.com.json",
);

/**
 * URLs específicas de portadas / secciones de mundodeportivo.com
 * (no se usa crawler, solo se auditan estas URLs)
 */
const URLS: string[] = [
  // — Home —
  "/",

  // — Fútbol nacional —
  "/futbol",
  "/futbol/laliga",
  "/futbol/liga-segunda-division",
  "/futbol/copa-del-rey",
  "/futbol/fichajes",
  "/seleccion-espanola",
  "/supercopa-espana",
  "/futbol/femenino",
  "/futbol/primera-rfef",
  "/futbol/futbol-catala",
  "/futbol/el-clasico-barca-real-madrid",
  "/horarios",

  // — Fútbol internacional —
  "/futbol/internacional",
  "/futbol/champions-league",
  "/futbol/europa-league",
  "/futbol/conference-league",
  "/futbol/premier-league",
  "/futbol/bundesliga",
  "/futbol/serie-a",
  "/futbol/ligue-1",
  "/futbol/copa-libertadores",
  "/futbol/mundial-de-clubes",

  // — Motor —
  "/motor",
  "/motor/f1",
  "/motor/motogp",
  "/motor/rallies",
  "/motor/rally-dakar",
  "/motor/mas-motor",
  "/solomoto",

  // — Más deportes —
  "/otros-deportes",
  "/tenis",
  "/baloncesto/euroliga",
  "/baloncesto/acb",
  "/baloncesto/nba",
  "/nfl",
  "/ufc",
  "/padel",
  "/golf",
  "/ciclismo",
  "/running",
  "/juegos-olimpicos",
  "/atletismo",
  "/natacion",
  "/balonmano",

  // — Canales —
  "/elotromundo",
  "/vaya-mundo",
  "/actualidad",
  "/tressesenta",
  "/foodie",
  "/pulso",
  "/tecnologia",
  "/videojuegos",
  "/ocio",

  // — Servicios —
  "/servicios",
  "/fotos",
  "/videos",
  "/resultados",
];

export default {
  site: "https://www.mundodeportivo.com",

  urls: URLS,

  scanner: {
    device: "mobile",
    crawler: false,
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

      const VALID_SAME_SITE = ["Strict", "Lax", "None"];
      const cookies = raw.map((c: any) => {
        const copy = { ...c };
        if (!VALID_SAME_SITE.includes(copy.sameSite)) {
          copy.sameSite = copy.secure ? "None" : "Lax";
        }
        return copy;
      });

      const didomiCookie = raw.find((c: any) => c.name === "didomi_token");
      const euCookie = raw.find((c: any) => c.name === "euconsent-v2");

      if (didomiCookie || euCookie) {
        try {
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
        } catch (e: any) {
          if (
            !e.message?.includes("Target closed") &&
            !e.message?.includes("Session closed")
          )
            throw e;
        }
      }

      try {
        await page.setCookie(...cookies);
      } catch (e: any) {
        if (!e.message?.includes("Target closed")) throw e;
      }
    },
  },
};
