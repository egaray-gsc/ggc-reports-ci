#!/bin/bash
set -e

SITE="lavanguardia.com"
TIMESTAMP=$(date +'%Y-%m-%d_%H%M%S')
OUTPUT_PATH="reports/${SITE}/${TIMESTAMP}"

echo "=== 1. Aceptar cookies de consentimiento ==="
node scripts/accept-cookies.js "https://www.${SITE}" /tmp/consent-cookies.json

echo ""
echo "=== 2. Ejecutar Unlighthouse audit ==="
npx unlighthouse-ci \
  --build-static \
  --output-path "${OUTPUT_PATH}/"

echo ""
echo "=== 3. Inyectar noindex meta ==="
find "${OUTPUT_PATH}/" -name "*.html" \
  -exec sed -i '' 's|<meta charset="utf-8">|<meta charset="utf-8">\
  <meta name="robots" content="noindex, nofollow">|' {} \;
find "${OUTPUT_PATH}/" -name "*.html" \
  -exec sed -i '' 's|<meta charset="UTF-8">|<meta charset="UTF-8">\
  <meta name="robots" content="noindex, nofollow">|' {} \;

echo ""
echo "=== 4. Generar index.html ==="
node scripts/generate-index.js

echo ""
echo "=== ✅ Listo ==="
echo "Report: ${OUTPUT_PATH}/"
echo "Abre: open ${OUTPUT_PATH}/index.html"
