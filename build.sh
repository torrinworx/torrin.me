#!/bin/bash
set -euo pipefail

# The stack is a submodule of TypeScript source, and its packages point their exports at a compiled
# dist/ that a submodule checkout does not carry, so everything below has to ask for the source by
# name (aweft design 256). `.npmrc` does that for what npm runs; this line does it for the times
# this script is run straight from a shell, deploy.sh included, and for the bundler, which resolves
# its own config file before any setting inside that file can apply.
export NODE_OPTIONS="${NODE_OPTIONS:-} --conditions=aweft-source"

BUILD_DIR="./build"
ZIP_FILE="./build.zip"

# What this build is called: the commit it was built from and when. deploy.sh sets it so the zip
# it ships and the answer /api/health gives are one name; a bare ./build.sh makes its own.
BUILD_ID="${BUILD_ID:-$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)}"
export BUILD_ID   # vite.config.ts stamps the page with it, so a visit names the build it hit

rm -rf "$BUILD_DIR"
rm -f "$ZIP_FILE"

# Resume PDF. Generated from frontend/data/resume.json, the same file the site imports, so the
# downloadable PDF can never drift from the web page. Must run before `vite build`, which copies
# frontend/public into the bundle. A failure here aborts the build on purpose: silently shipping a
# stale resume is the bug this step exists to prevent.
npm run resume:pdf

# The blog: every post read and checked, its media hashed into frontend/public, the index the
# bundle imports and the twins the browser fetches written. Before vite, which copies
# frontend/public into dist as it is; and before the typecheck in the gate, which imports the index.
npm run content

# The soundfont the radio plays: 32 MB, fetched once and kept out of git. Shipped in the zip, so
# the droplet never fetches anything.
[[ -f radio/assets/GeneralUser-GS.sf2 ]] || npm run soundfont

# The page bundle and the shell, then every page written out as a file beside them.
# `--configLoader native` has Node import this config rather than the bundler pre-bundling it with
# a resolver of its own, which is the only way the condition above reaches the plugin the config
# imports. Everything inside the config is then resolved with `resolve.conditions`, which it sets.
NODE_ENV=production npx --no-install vite build --configLoader native
npm run pages

# What ships is a trimmed copy of this repo, laid out exactly as it is here, so every relative
# path inside the server means on the droplet what it means locally. The alternative was bundling
# the server, which would have moved `dist` relative to the entry file and forced the site's own
# modules to be static imports. The stack is 2.2 MB of source; the old build was 9.6 MB.
mkdir -p "$BUILD_DIR"
cp -r ./dist "$BUILD_DIR/dist"
cp ./main.ts "$BUILD_DIR/main.ts"
cp -r ./modules "$BUILD_DIR/modules"

# The stamp main.ts reads beside itself and answers from /api/health, so a poll can tell this build
# from the one it replaced. A checkout has no such file and answers null.
printf '{ "build": "%s" }\n' "$BUILD_ID" > "$BUILD_DIR/build.json"

# The stack: source and manifests only. No tests, no recipes, no git history. What ships is that
# source, so the server has to ask for it by name the way every script here does. run.sh passes the
# condition on the command line, because .npmrc reaches what npm runs and not a bare `node`.
mkdir -p "$BUILD_DIR/aweft/packages"
cp ./aweft/package.json "$BUILD_DIR/aweft/package.json"
for pkg in ./aweft/packages/*/; do
	name="$(basename "$pkg")"
	mkdir -p "$BUILD_DIR/aweft/packages/$name"
	cp -r "$pkg/src" "$BUILD_DIR/aweft/packages/$name/src"
	cp "$pkg/package.json" "$BUILD_DIR/aweft/packages/$name/package.json"
done

# The deploy manifest: the same workspace links, none of the tooling.
node --input-type=module -e '
	import { readFileSync, writeFileSync } from "node:fs";
	const own = JSON.parse(readFileSync("./package.json", "utf8"));
	writeFileSync("./build/package.json", JSON.stringify({
		name: "torrin.me-deploy",
		private: true,
		type: "module",
		workspaces: own.workspaces,
		dependencies: own.dependencies,
	}, null, "\t") + "\n");
'

cat << 'EOF' > "$BUILD_DIR/run.sh"
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. ~/.nvm/nvm.sh
nvm use 25
cd "$SCRIPT_DIR"
npm i --omit=dev
node --conditions=aweft-source --import @aweftjs/build/loader main.ts
EOF

# The radio: its source, its manifest and the soundfont, laid out as they are here. setup.sh
# copies this directory to a home of its own and restarts the radio only when it changed, so a
# deploy that touched nothing here leaves the stream playing.
mkdir -p "$BUILD_DIR/radio"
cp ./radio/*.ts ./radio/package.json "$BUILD_DIR/radio/"
cp -r ./radio/assets "$BUILD_DIR/radio/assets"

cat << 'EOF' > "$BUILD_DIR/radio/run.sh"
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. ~/.nvm/nvm.sh
nvm use 25
cd "$SCRIPT_DIR"
npm i --omit=dev
node --expose-gc main.ts
EOF

cp ./setup.sh "$BUILD_DIR/setup.sh"
chmod +x "$BUILD_DIR/run.sh" "$BUILD_DIR/radio/run.sh" "$BUILD_DIR/setup.sh"

pushd "$BUILD_DIR" >/dev/null
zip -rq "../$ZIP_FILE" .
popd >/dev/null

du -sh "$BUILD_DIR"
du -sh "$ZIP_FILE"
echo "build $BUILD_ID"
