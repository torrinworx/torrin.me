# Sourced by app-deploy's setup.sh on the droplet. The radio is a second process with its own unit,
# its own directory and its own rule for when it restarts, and two nginx routes that need its port
# from the droplet's .env; no other app has any of that, so it lives here and not in deploy.conf.

RADIO_SERVICE="torrin.me-radio"
RADIO_DIR="/var/www/torrin.me/radio"

after_service() {
	# The radio's port, read the same way as PORT. A missing line means 3010, the default main.ts
	# has, and not a failed deploy: under set -e a grep with no match would stop the script here,
	# after the site was stopped.
	RADIO_PORT=$( (grep -E '^RADIO_PORT=' "$R$ENV_FILE" || true) | tail -n1 | cut -d'=' -f2-)
	RADIO_PORT="${RADIO_PORT:-3010}"

	# ffmpeg is the encoder. The package is installed once and never again. The index refresh is
	# allowed to fail: a third-party repository with no release file for this Ubuntu (the certbot
	# PPA, on 2026-09-24) would otherwise end the deploy here, with the site already restarted
	# and nginx not yet written.
	if ! command -v ffmpeg >/dev/null; then
		apt-get update -qq || echo "apt-get update failed, installing from the index as it is"
		DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg
	fi

	# The radio runs from a directory of its own, so the deploy directory can be wiped under it. It
	# is replaced and restarted only when what shipped differs from what runs: a deploy that changed
	# the site alone never cuts the stream.
	local shipped running
	shipped=$(cd "$R$DEPLOY_DIR/radio" && find . -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)
	running=$(cat "$R$RADIO_DIR/.shipped" 2>/dev/null || true)
	if [[ "$shipped" != "$running" ]] || ! systemctl is-active --quiet "$RADIO_SERVICE"; then
		systemctl stop "$RADIO_SERVICE" || echo "skipped stop $RADIO_SERVICE"
		rm -rf "$R$RADIO_DIR"
		mkdir -p "$R$RADIO_DIR"
		cp -r "$R$DEPLOY_DIR/radio/." "$R$RADIO_DIR/"
		echo "$shipped" > "$R$RADIO_DIR/.shipped"
		chmod +x "$R$RADIO_DIR/run.sh"

		cat << EOF | tee "$R/etc/systemd/system/${RADIO_SERVICE}.service" > /dev/null
[Unit]
Description=torrin.me radio
After=network.target

[Service]
Type=simple
ExecStart=${RADIO_DIR}/run.sh
WorkingDirectory=${RADIO_DIR}
Restart=always
RestartSec=2
EnvironmentFile=${ENV_FILE}

[Install]
WantedBy=multi-user.target
EOF

		systemctl daemon-reload
		systemctl enable "$RADIO_SERVICE"
		systemctl restart "$RADIO_SERVICE"
		echo "radio replaced and restarted ($shipped)"
	else
		echo "radio unchanged, left playing"
	fi

	NGINX_SERVER_EXTRA="
    # The radio's live stream, straight from its own process. Buffering off, or nginx holds
    # the audio back in chunks. A long read timeout, because a listener stays for hours.
    location = /radio/stream {
        proxy_pass http://127.0.0.1:${RADIO_PORT}/stream;
        proxy_http_version 1.1;
        proxy_set_header Connection \"\";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 1d;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # What is on the air, for the page's now-playing line and the bars on a phone.
    location = /radio/now {
        proxy_pass http://127.0.0.1:${RADIO_PORT}/now;
    }
"
}
