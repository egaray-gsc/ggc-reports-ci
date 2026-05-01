import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(
  os.tmpdir(),
  "consent-cookies-lavanguardia.com.json",
);

/**
 * URLs específicas de portadas / secciones de lavanguardia.com
 * (no se usa crawler, solo se auditan estas URLs)
 */
const URLS: string[] = [
  // — Home —
  "/",

  // — Secciones principales —
  "/internacional",
  "/politica",
  "/cultura",
  "/sociedad",
  "/peludos",
  "/motor",
  "/deportes",
  "/local",
  "/gente",
  "/viral",
  "/tecnologia",
  "/economia",
  "/pop",
  "/sucesos",
  "/participacion",
  "/suscriptores",
  "/dinero",

  // — Verticales / marcas —
  "/magazine",
  "/magazine/viajes",
  "/magazine/moda",
  "/vivo",
  "/moveo",
  "/comer",
  "/historiayvida",
  "/launi",
  "/seguros",
  "/mascotas",
  "/neo",
  "/comprar",
  "/comprar/comparativas",
  "/cribeo",
  "/series",
  "/natural",
  "/ciencia",
  "/salud",

  // — Contenidos especiales —
  "/videos",
  "/videos/claves-del-dia",
  "/fotos",
  "/lacontra",
  "/a-fondo",
  "/narrativas-visuales",
  "/en-mejora-continua",
  "/monograficos",

  // — Local —
  "/local/madrid",
  "/local/barcelona",
  "/local/catalunya",
  "/local/andalucia",
  "/local/valencia",
  "/local/pais-vasco",

  // — Utilidades —
  "/juegos",
  "/perfil/ev/tarjeta?pageId=quickprofile",
  "/libros",
  "/clasificados",
  "/foros",
  "/eventos",
  "/que-fem",
  "/horoscopo",
  "/vanguardia-de-la-ciencia",
  "/deportes/resultados",
  "/television/programacion-tv",
  "/empresas-de-vanguardia/directorio",
  "/empresas-de-vanguardia/directorio/listado",
  "/temas/eventos-la-vanguardia",
];

export default {
  site: "https://www.lavanguardia.com",

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
