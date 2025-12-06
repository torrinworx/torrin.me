#!/bin/bash

set -e

BUILD_DIR="./build"
ZIP_FILE="./build.zip"

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

if ! command_exists git; then
	sudo apt-get update
	sudo apt-get install -y git
fi

git submodule init
git submodule update --init --recursive

npm i
npx vite build
rm -rf './node_modules'
npm i --production
npx esbuild backend/index.js --bundle --platform=node --target=node23 --outfile=$BUILD_DIR/index.js --format=esm --external:fs --external:path --external:os --external:crypto --external:vite --external:lightningcss

cat << 'EOF' > "$BUILD_DIR/run.sh"
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. ~/.nvm/nvm.sh use 23
node "$SCRIPT_DIR/index.js"
EOF

chmod +x "$BUILD_DIR/run.sh"
zip -r "$ZIP_FILE" "$BUILD_DIR"
du -sh "$BUILD_DIR"
du -sh "$ZIP_FILE"
