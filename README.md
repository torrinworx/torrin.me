My personal website and portfolio, check it out at [torrin.me](https://torrin.me)!

# in the prod vm for opengig rn:
nginx config located at: /etc/nginx/sites-enabled/opengig.org
systemd service located at: /etc/systemd/system/opengig.service

# to create a new cert:
with certbot installed:
```bash
sudo certbot --nginx -d opengig.org
```

location of certs:
```
ssl_certificate: /etc/letsencrypt/live/opengig.org/fullchain.pem
ssl_certificate_key: /etc/letsencrypt/live/opengig.org/privkey.pem
```

torrin.me will run on port 3001 with opengig running on 3000
