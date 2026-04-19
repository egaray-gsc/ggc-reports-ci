# ggc-reports-ci

Sitio estático en GitHub Pages que acumula informes de rendimiento generados con [Unlighthouse](https://unlighthouse.dev/) (Lighthouse) vía GitHub Actions.

## Lanzar una auditoría

1. Ve a **Actions** → **Lighthouse - lavanguardia.com**
2. Pulsa **Run workflow** → **Run workflow**
3. Cuando termine, el report aparecerá en `index.html` automáticamente.

## Añadir otro sitio

1. Copia `.github/workflows/lighthouse-lavanguardia.yml` con un nuevo nombre (p. ej. `lighthouse-elpais.yml`).
2. Cambia el `name` del workflow.
3. Crea un nuevo `unlighthouse.config.ts` para ese sitio (o usa `--site` en el comando).
4. Ajusta el `--output-path` al nuevo dominio (p. ej. `reports/elpais.com/...`).
5. `scripts/generate-index.js` detectará el nuevo dominio automáticamente.

## Configurar GitHub Pages

1. Ve a **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **(root)**
4. Guarda. El sitio estará disponible en `https://<org>.github.io/ggc-reports-ci/`
