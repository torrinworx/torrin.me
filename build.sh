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

install_nvm_and_node() {
	echo "Installing NVM..."
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

	export NVM_DIR="$HOME/.nvm"
	if [ -s "$NVM_DIR/nvm.sh" ]; then
		source "$NVM_DIR/nvm.sh"
	else
		echo "nvm.sh not found. Exiting."
		exit 1
	fi

	if [ -s "$NVM_DIR/bash_completion" ]; then
		source "$NVM_DIR/bash_completion"
	fi

	echo "Installing Node.js version 23..."
	nvm install 23
	nvm use 23

	echo "NVM version:"
	nvm --version

	echo "Node version:"
	node --version

	echo "NPM version:"
	npm --version
}

# Check if Node.js and NPM are installed
if command_exists node && command_exists npm; then
	echo "Node and NPM are already installed."
	node --version
	npm --version
else
	echo "Node or NPM not found. Attempting to install via NVM."
	install_nvm_and_node
fi

if [ -d "$BUILD_DIR" ]; then
	rm -rf "$BUILD_DIR"
fi

if [ -f "$ZIP_FILE" ]; then
	rm -f "$ZIP_FILE"
fi

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
