#!/usr/bin/env bash
# Relocate Vocs output (basePath=/docs, files at dist/public root) into public/docs
# for the Worker ASSETS directory. Also sync static brand assets.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_VOCS=dist/public
DEST=public/docs

[ -d "$OUT_VOCS" ] || { echo "✘ $OUT_VOCS missing — run 'vocs build' first"; exit 1; }

rm -rf "$DEST"
mkdir -p "$DEST"

for path in "$OUT_VOCS"/*; do
  [ -e "$path" ] || continue
  base=$(basename "$path")
  case "$base" in
    docs) : ;;
    *) mv -f "$path" "$DEST/" ;;
  esac
done

# Favicon for docs (iconUrl: /curb-sun.svg → /docs/curb-sun.svg with basePath)
cp -f public/curb-sun.svg "$DEST/curb-sun.svg" 2>/dev/null || \
  cp -f assets/curb-sun.svg "$DEST/curb-sun.svg" 2>/dev/null || true

mkdir -p public/assets
cp -f assets/curb-sun.svg public/assets/ 2>/dev/null || true
cp -f assets/curb-sun.png public/assets/ 2>/dev/null || true
cp -f assets/curb-favicon-32.png public/assets/ 2>/dev/null || true
cp -f assets/curb-icon-512.png public/assets/ 2>/dev/null || true

echo "✓ postbuild-docs: Vocs → public/docs ; brand assets → public/assets"
