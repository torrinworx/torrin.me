#!/bin/bash
# Build here, ship the zip, let setup.sh do the rest.
#
# This replaces the GitHub Actions deploy, which could not build this site while the aweft stack had
# no git remote for a runner to check out. It has one now and the stack is a submodule, so a
# workflow that checks out submodules is a thing to write, and this file goes when it is written.
#
# Usage: PUBLIC_IP=<droplet> ./deploy.sh
#
# After setup.sh restarts the service this polls https://torrin.me/api/health until the build
# answering is the one it shipped, and exits nonzero if that does not happen inside the wait. The
# service runs `npm i` before it starts, so the first answers are the old process or nothing at
# all; a 200 is not enough on its own, because a wrong build answers 200 too. Nothing here rolls
# back: a failed verification is a build still in place and a message saying so.
set -euo pipefail

: "${PUBLIC_IP:?set PUBLIC_IP to the droplet address}"
export BUILD_ID="$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)"
HEALTH_URL="${HEALTH_URL:-https://torrin.me/api/health}"

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

# The build that answers, read off the body; empty when nothing answers or the body is not the
# health answer (a shell served for an unknown URL is a 200 with HTML in it).
answering() {
	curl -s -m 5 "$HEALTH_URL" | node --input-type=module -e '
		let raw = "";
		for await (const chunk of process.stdin) raw += chunk;
		try { const body = JSON.parse(raw); console.log(body.ok === true && typeof body.info?.build === "string" ? body.info.build : ""); }
		catch { console.log(""); }
	'
}

echo "waiting for $BUILD_ID at $HEALTH_URL"
for attempt in $(seq 1 90); do
	live="$(answering || true)"
	if [[ "$live" == "$BUILD_ID" ]]; then
		echo "deployed $BUILD_ID"
		exit 0
	fi
	sleep 2
done
echo "not verified: $HEALTH_URL answers build '${live:-nothing}', not $BUILD_ID" >&2
exit 1
