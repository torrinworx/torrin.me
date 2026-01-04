#!/usr/bin/env bash
set -euo pipefail

BUILD_DIR="$1"

SERVICE_NAME="torrin.me"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
DEPLOY_DIR="/var/www/torrin.me/deploy"
ENV_FILE="/var/www/torrin.me/.env"
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/torrin.me"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/torrin.me"

DOMAIN="torrin.me"
WEBROOT="/var/www/torrin.me/html"
EMAIL="torrin@torrin.me"
CERT_LIVE_DIR="/etc/letsencrypt/live/${DOMAIN}"

# Stop existing service if it exists
systemctl stop "$SERVICE_NAME" || echo "skipped stop $SERVICE_NAME"

# Ensure deploy dir exists
mkdir -p "$DEPLOY_DIR"

# Clear existing deploy contents (if any)
rm -rf "$DEPLOY_DIR"/*

# Move new build to deploy
shopt -s dotglob nullglob
mv "$BUILD_DIR"/* "$DEPLOY_DIR"/ || echo "no files to move from $BUILD_DIR"

# Make sure run.sh is executable
if [[ -f "$DEPLOY_DIR/run.sh" ]]; then
  chmod +x "$DEPLOY_DIR/run.sh"
else
  echo "ERROR: $DEPLOY_DIR/run.sh not found"
  exit 1
fi

# Get PORT from .env (simple grep; assumes lines like PORT=3000)
if [[ -f "$ENV_FILE" ]]; then
  PORT=$(grep -E '^PORT=' "$ENV_FILE" | tail -n1 | cut -d'=' -f2-)
else
  echo "ERROR: $ENV_FILE not found; can't configure Nginx PORT"
  exit 1
fi

if [[ -z "${PORT:-}" ]]; then
  echo "ERROR: PORT is empty or not set in $ENV_FILE"
  exit 1
fi

# systemd service
cat << 'EOF' | tee "/etc/systemd/system/torrin.me.service" > /dev/null
[Unit]
Description=torrin.me
After=network.target

[Service]
Type=simple
ExecStart=/var/www/torrin.me/deploy/run.sh
WorkingDirectory=/var/www/torrin.me/deploy
Restart=always
EnvironmentFile=/var/www/torrin.me/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

############################
# Certbot / nginx handling #
############################

mkdir -p "$WEBROOT"

CERT_EXISTS=false
if [[ -f "${CERT_LIVE_DIR}/fullchain.pem" && -f "${CERT_LIVE_DIR}/privkey.pem" ]]; then
  CERT_EXISTS=true
  echo "Existing cert found for ${DOMAIN}"
else
  echo "No existing cert for ${DOMAIN}, will attempt to obtain one"
fi

# If no cert, get one via webroot
if [[ "$CERT_EXISTS" = false ]]; then
  # temporary HTTP-only server to serve the ACME challenge
  tee "$NGINX_SITE_AVAILABLE" > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    root ${WEBROOT};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 503;
    }
}
EOF

  ln -sf "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
  nginx -t
  systemctl reload nginx

  # request certificate
  certbot certonly \
    --webroot \
    -w "${WEBROOT}" \
    -d "${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --non-interactive \
    --no-eff-email

  if [[ ! -f "${CERT_LIVE_DIR}/fullchain.pem" || ! -f "${CERT_LIVE_DIR}/privkey.pem" ]]; then
    echo "ERROR: Certbot did not create certificates as expected."
    exit 1
  fi
fi

FULLCHAIN="${CERT_LIVE_DIR}/fullchain.pem"
PRIVKEY="${CERT_LIVE_DIR}/privkey.pem"

if [[ ! -f "$FULLCHAIN" || ! -f "$PRIVKEY" ]]; then
  echo "ERROR: Certificate files not found at expected paths."
  exit 1
fi

# final nginx config with SSL + proxy
tee "$NGINX_SITE_AVAILABLE" > /dev/null <<EOF
server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate     ${FULLCHAIN};
    ssl_certificate_key ${PRIVKEY};
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:${PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name ${DOMAIN};

    # ACME HTTP-01 challenge
    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    # Redirect everything else to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

ln -sf "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"

nginx -t
systemctl reload nginx
