#!/bin/bash

rm -R ./build

vite build
vite build --config vite.config.ssg.js 
node ./destamatic-ui/ssg/build.js ./build ./frontend
npx esbuild ./server.js --bundle --platform=node --target=node25 --outfile=./build/server.js --format=esm --external:fs --external:path --external:os --external:crypto --external:vite --external:lightningcss
