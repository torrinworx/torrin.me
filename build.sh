#!/bin/bash
set -euo pipefail

BUILD_DIR="./build"
ZIP_FILE="./build.zip"

# Clean previous build + zip
rm -rf "$BUILD_DIR"
rm -f "$ZIP_FILE"

# Resume PDF. Generated from frontend/data/resume.json, the same file the site imports,
# so the downloadable PDF can never drift from the web page. Must run before `vite build`,
# which copies frontend/public into the bundle. A failure here aborts the build on
# purpose: silently shipping a stale resume is the bug this step exists to prevent.
if [ -x ./.venv/bin/python ]; then
	PYTHON=./.venv/bin/python
else
	PYTHON=python3
fi
"$PYTHON" resume_pdf_generator.py

# Frontend builds
vite build
vite build --config vite.config.ssg.js

# SSG step
node ./destamatic-ui/ssg/build.js "$BUILD_DIR" ./frontend https://torrin.me

# Server
cp ./server.js "$BUILD_DIR/server.js"
cp ./package.json "$BUILD_DIR/package.json"
cp ./package-lock.json "$BUILD_DIR/package-lock.json"

# Create run.sh inside build
cat << 'EOF' > "$BUILD_DIR/run.sh"
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. ~/.nvm/nvm.sh
nvm use 25
cd "$SCRIPT_DIR"
npm i --production
node "$SCRIPT_DIR/server.js"
EOF

cp ./setup.sh "$BUILD_DIR/setup.sh"

chmod +x "$BUILD_DIR/run.sh"
chmod +x "$BUILD_DIR/setup.sh"

pushd "$BUILD_DIR" >/dev/null
zip -r "../$ZIP_FILE" .
popd >/dev/null

# Show sizes
du -sh "$BUILD_DIR"
du -sh "$ZIP_FILE"
