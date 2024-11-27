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
git submodule update

if ! command_exists nvm; then
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
	export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
	[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

nvm install 21
nvm use 21

if [ -d "$BUILD_DIR" ]; then
	rm -rf "$BUILD_DIR"
fi

if [ -f "$ZIP_FILE" ]; then
	rm -f "$ZIP_FILE"
fi

# Install npm dependencies and build the project
npm install
npx vite build

rm -rf ./web-core/.git
rm -rf ./destamatic-ui/.git

# Prepare build directory
mkdir -p "$BUILD_DIR"

# Copy files to build directory
cp -r ./backend "$BUILD_DIR"
cp -r ./web-core "$BUILD_DIR"
cp -r ./destamatic-ui "$BUILD_DIR"
cp -r ./node_modules "$BUILD_DIR"
cp ./package.json "$BUILD_DIR"
cp ./package-lock.json "$BUILD_DIR"

# Create the run script in the build directory
cat << 'EOF' > "$BUILD_DIR/run.sh"
#!/bin/bash
node ./backend/index.js
EOF

chmod +x "$BUILD_DIR/run.sh"
