#!/bin/bash
# Build here, ship the zip, let setup.sh do the rest.
#
# This replaces the GitHub Actions deploy. Actions cannot build this site: the aweft stack has no
# git remote yet, so a runner has nothing to check out. When aweft is pushed, the workflow comes
# back and this file goes.
#
# Usage: PUBLIC_IP=<droplet> ./deploy.sh
set -euo pipefail

: "${PUBLIC_IP:?set PUBLIC_IP to the droplet's address}"
BUILD_ID="$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)"

./build.sh

ssh -o StrictHostKeyChecking=accept-new "root@$PUBLIC_IP" "mkdir -p /var/www/downloads"
scp -o StrictHostKeyChecking=accept-new ./build.zip "root@$PUBLIC_IP:/var/www/downloads/build-$BUILD_ID.zip"

ssh -o StrictHostKeyChecking=accept-new "root@$PUBLIC_IP" "
	set -euo pipefail
	BUILD_DIR=/var/www/downloads/build-$BUILD_ID
	mkdir -p \"\$BUILD_DIR\"
	unzip -o -qq /var/www/downloads/build-$BUILD_ID.zip -d \"\$BUILD_DIR\"
	rm /var/www/downloads/build-$BUILD_ID.zip
	mv \"\$BUILD_DIR/setup.sh\" /tmp/setup-$BUILD_ID.sh
	chmod +x /tmp/setup-$BUILD_ID.sh
	/tmp/setup-$BUILD_ID.sh \"\$BUILD_DIR\"
	rm -f /tmp/setup-$BUILD_ID.sh
"
echo "deployed $BUILD_ID"
