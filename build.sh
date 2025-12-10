#!/bin/bash
set -euo pipefail

BUILD_DIR="./build"
ZIP_FILE="./build.zip"

# Clean previous build + zip
rm -rf "$BUILD_DIR"
rm -f "$ZIP_FILE"

# Frontend builds
vite build
vite build --config vite.config.ssg.js

# SSG step
node ./destamatic-ui/ssg/build.js "$BUILD_DIR" ./frontend https://torrin.me

# Bundle server
npx esbuild ./server.js \
  --bundle \
  --platform=node \
  --target=node25 \
  --outfile="$BUILD_DIR/server.js" \
  --format=esm \
  --external:fs \
  --external:path \
  --external:os \
  --external:crypto \
  --external:vite \
  --external:lightningcss

# Create run.sh inside build
cat << 'EOF' > "$BUILD_DIR/run.sh"
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. ~/.nvm/nvm.sh use 23
node "$SCRIPT_DIR/server.js"
EOF

chmod +x "$BUILD_DIR/run.sh"

# Create zip with everything inside build/

  zip -r "$ZIP_FILE" "$BUILD_DIR"

# Show sizes
du -sh "$BUILD_DIR"
du -sh "$ZIP_FILE"