# ggc-reports-ci

Sitio estático en GitHub Pages que acumula informes de rendimiento generados con [Unlighthouse](https://unlighthouse.dev/) (Lighthouse) vía GitHub Actions.

## Sitios auditados

| Sitio                                                | Config                                  | Rutas máx. |
| ---------------------------------------------------- | --------------------------------------- | ---------- |
| [lavanguardia.com](https://www.lavanguardia.com)     | `unlighthouse-lavanguardia.config.ts`   | 50         |
| [mundodeportivo.com](https://www.mundodeportivo.com) | `unlighthouse-mundodeportivo.config.ts` | 50         |

## Lanzar una auditoría

1. Ve a **Actions** → **Lighthouse - lavanguardia.com** (o el sitio que quieras auditar).
2. Pulsa **Run workflow** → **Run workflow**.
3. Cuando termine, el report aparecerá en el `index.html` de GitHub Pages automáticamente.

### Qué hace el workflow

1. Instala Node 22, Chrome y las dependencias (`@unlighthouse/cli`, `puppeteer`).
2. Acepta las cookies de consentimiento (Didomi) con `scripts/accept-cookies.js` y las guarda en `/tmp/consent-cookies.json`.
3. Ejecuta `unlighthouse-ci` con el config del sitio; las cookies se inyectan en cada página via el hook `puppeteer:before-goto`.
4. Inyecta `<meta name="robots" content="noindex, nofollow">` en los HTML generados.
5. Poda los reports antiguos (conserva los 3 más recientes por dominio).
6. Regenera `index.html` con `scripts/generate-index.js`.
7. Hace commit y push a `main`.

## Probar en local

```bash
bash scripts/test-local.sh
```

Reproduce el workflow completo en tu máquina (requiere Chrome instalado).

## Estructura del proyecto

```
├── .github/workflows/
│   ├── lighthouse-lavanguardia.yml      # Workflow para lavanguardia.com
│   └── lighthouse-mundodeportivo.yml    # Workflow para mundodeportivo.com
├── scripts/
│   ├── accept-cookies.js               # Acepta el banner Didomi y guarda cookies
│   ├── generate-index.js               # Regenera index.html con los reports disponibles
│   └── test-local.sh                   # Reproduce el workflow en local
├── reports/
│   └── <dominio>/<timestamp>/           # Reports Unlighthouse generados
├── unlighthouse-lavanguardia.config.ts  # Config Unlighthouse lavanguardia
├── unlighthouse-mundodeportivo.config.ts # Config Unlighthouse mundodeportivo
├── index.html                           # Página principal (autogenerada)
├── styles.css                           # Tema oscuro para index.html
├── robots.txt                           # Disallow: / (bloquea crawlers)
└── package.json
```

## Añadir otro sitio

1. Copia `.github/workflows/lighthouse-lavanguardia.yml` con un nuevo nombre (p. ej. `lighthouse-elpais.yml`).
2. Cambia el `name` del workflow y las referencias al dominio.
3. Crea un nuevo `unlighthouse-<dominio>.config.ts` con la URL y las opciones del sitio.
4. Ajusta el `--output-path` al nuevo dominio (p. ej. `reports/elpais.com/...`).
5. Si el sitio tiene banner de cookies distinto a Didomi, adapta `accept-cookies.js`.
6. `scripts/generate-index.js` detectará el nuevo dominio automáticamente.

## Configurar GitHub Pages

1. Ve a **Settings** → **Pages**.
2. Source: **Deploy from a branch**.
3. Branch: **main** / **(root)**.
4. Guarda. El sitio estará disponible en `https://<org>.github.io/ggc-reports-ci/`.
