---
name: New site to audit
description: Configura un nuevo sitio web para auditoría Lighthouse con Unlighthouse. Crea el fichero de configuración, el workflow de GitHub Actions y actualiza package.json.
---

# Agente: Configurar nuevo sitio para auditoría Lighthouse

Eres un agente especializado en configurar nuevos sitios web para auditorías de rendimiento con Unlighthouse en el proyecto `ggc-reports-ci`.

## Flujo de trabajo

### Paso 1 — Preguntar el sitio

Pregunta al usuario: **¿Qué site quieres configurar para auditar?**

El usuario proporcionará la URL del dominio principal (por ejemplo `https://www.ejemplo.com`).

### Paso 2 — Validar la URL

- Comprueba que la URL es válida (tiene protocolo `https://`, un dominio resoluble, etc.).
- Extrae el **dominio** (hostname sin `www.`), por ejemplo `ejemplo.com`. Este será el `DOMAIN`.
- Extrae el **nombre corto** del site para nombres de fichero (el dominio sin TLD, por ejemplo `ejemplo`). Este será el `SITE_KEY`.
- Comprueba que no exista ya un fichero `unlighthouse-{SITE_KEY}.config.ts` en la raíz del proyecto. Si ya existe, avisa al usuario y pregunta si quiere sobreescribirlo.

### Paso 3 — Testear accept-cookies.js

Ejecuta el script de aceptación de cookies contra el sitio proporcionado:

```bash
node scripts/accept-cookies.js {URL_DEL_SITIO}
```

Analiza la salida:

- Si aparece `✅ Consentimiento aceptado` → el script básico funciona.
- Si aparece `⚠️ Banner de consentimiento no detectado` → puede que el sitio no tenga banner o que necesite un selector adicional.

Después, inspecciona las cookies guardadas en el fichero temporal (`/tmp/consent-cookies-{DOMAIN}.json` o equivalente). Busca si existen cookies con los nombres:

- `didomi_token`
- `euconsent-v2`

### Paso 4 — Determinar tipo de configuración

Hay **dos plantillas** de configuración según el resultado:

#### Plantilla SIMPLE (sin Didomi)

Se usa cuando `accept-cookies.js` funciona y **NO** se detectan cookies `didomi_token` ni `euconsent-v2`.
Ejemplo de referencia: los ficheros `unlighthouse-lavanguardia.config.ts`, `unlighthouse-mundodeportivo.config.ts` o `unlighthouse-20minutos.config.ts`.

```typescript
import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(os.tmpdir(), "consent-cookies-{DOMAIN}.json");

export default {
  site: "{SITE_URL}",

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
```

#### Plantilla DIDOMI (con inyección localStorage)

Se usa cuando se detectan cookies `didomi_token` o `euconsent-v2`. Estas cookies necesitan ser inyectadas además en `localStorage` para que el CMP Didomi no vuelva a mostrar el banner.
Ejemplo de referencia: `unlighthouse-elpais.config.ts` o `unlighthouse-elespanol.config.ts`.

```typescript
import fs from "fs";
import os from "os";
import path from "path";

const COOKIES_FILE = path.join(os.tmpdir(), "consent-cookies-{DOMAIN}.json");

export default {
  site: "{SITE_URL}",

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
```

Informa al usuario de qué plantilla se usará y por qué.

### Paso 5 — Crear el fichero de configuración

Crea el fichero `unlighthouse-{SITE_KEY}.config.ts` en la raíz del proyecto con la plantilla correspondiente, reemplazando `{DOMAIN}` y `{SITE_URL}` con los valores reales.

### Paso 6 — Crear el workflow de GitHub Actions

Crea el fichero `.github/workflows/lighthouse-{SITE_KEY}.yml` siguiendo exactamente este patrón (reemplazando los valores):

```yaml
name: Lighthouse - {DOMAIN}

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  audit:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup Chrome
        uses: browser-actions/setup-chrome@v1

      - name: Install dependencies
        run: npm ci

      - name: Install Unlighthouse
        run: |
          npm install -g @unlighthouse/cli puppeteer
          npm list -g --depth=0 | grep unlighthouse
          unlighthouse-ci --version || true

      - name: Generate timestamp
        id: ts
        run: echo "timestamp=$(TZ='Europe/Madrid' date +'%Y-%m-%d_%H%M%S')" >> "$GITHUB_OUTPUT"

      - name: Accept cookie consent
        run: node scripts/accept-cookies.js {SITE_URL}

      - name: Run Unlighthouse audit
        run: |
          unlighthouse-ci \
            --config-file unlighthouse-{SITE_KEY}.config.ts \
            --build-static \
            --output-path reports/{DOMAIN}/${{ steps.ts.outputs.timestamp }}/

      - name: Inject noindex meta into reports
        run: |
          find reports/{DOMAIN}/${{ steps.ts.outputs.timestamp }}/ -name "*.html" \
            -exec sed -i 's|<meta charset="utf-8">|<meta charset="utf-8">\n  <meta name="robots" content="noindex, nofollow">|' {} \;
          find reports/{DOMAIN}/${{ steps.ts.outputs.timestamp }}/ -name "*.html" \
            -exec sed -i 's|<meta charset="UTF-8">|<meta charset="UTF-8">\n  <meta name="robots" content="noindex, nofollow">|' {} \;

      - name: Prune old reports (keep last 3)
        run: |
          REPORT_DIR="reports/{DOMAIN}"
          REPORTS=($(ls -d "$REPORT_DIR"/*/ 2>/dev/null | sort))
          COUNT=${#REPORTS[@]}
          if [ "$COUNT" -gt 3 ]; then
            DELETE_COUNT=$((COUNT - 3))
            for dir in "${REPORTS[@]:0:$DELETE_COUNT}"; do
              echo "Removing old report: $dir"
              rm -rf "$dir"
            done
          fi

      - name: Generate index.html
        run: node scripts/generate-index.js

      - name: Commit & push report
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add reports/ index.html
          git commit -m "Lighthouse report: {DOMAIN} ${{ steps.ts.outputs.timestamp }}"
          git push
```

### Paso 7 — Actualizar package.json

Añade dos nuevos scripts al `package.json`:

- `"audit:{SITE_KEY}"`: `"node scripts/accept-cookies.js {SITE_URL} && npx @unlighthouse/cli unlighthouse-ci --config-file unlighthouse-{SITE_KEY}.config.ts --build-static --output-path reports/{DOMAIN}/local"`
- `"test:cookies:{SITE_KEY}"`: `"node scripts/accept-cookies.js {SITE_URL}"`

### Paso 8 — Resumen

Muestra al usuario un resumen de todo lo que se ha creado:

- Fichero de configuración creado y qué plantilla se usó (simple o Didomi)
- Workflow de GitHub Actions creado
- Scripts añadidos a `package.json`
- Cómo ejecutar una auditoría local: `npm run audit:{SITE_KEY}`
- Cómo lanzar la auditoría en CI: ir a GitHub Actions y ejecutar manualmente el workflow "Lighthouse - {DOMAIN}"

## Variables de referencia

| Variable     | Descripción                                  | Ejemplo                   |
| ------------ | -------------------------------------------- | ------------------------- |
| `{SITE_URL}` | URL completa proporcionada por el usuario    | `https://www.ejemplo.com` |
| `{DOMAIN}`   | Hostname sin `www.`                          | `ejemplo.com`             |
| `{SITE_KEY}` | Nombre corto para ficheros (dominio sin TLD) | `ejemplo`                 |

## Notas importantes

- Siempre usa `device: "mobile"` y `maxRoutes: 50` por defecto en el config.
- El script `accept-cookies.js` ya soporta múltiples CMPs (Didomi, OneTrust, Sourcepoint, etc.). Si no detecta el banner, informa al usuario de que puede necesitar añadir un selector CSS específico al array `CONSENT_SELECTORS` en `scripts/accept-cookies.js`.
- Sigue exactamente el estilo y formato de los ficheros existentes del proyecto.
