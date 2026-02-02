
# header
Kimai time tracker setup guide.

# description
A quick, copy-paste Docker Compose setup for running Kimai with a MySQL backend. It walks you through creating a `.env`, launching the stack, and getting Kimai reachable on port `8001`.

# created
2026-01-28T23:17:00-05:00

# modified
2026-01-28T23:17:00-05:00

> Read the full story of how Kimai saved my parent's company $28,800 dollars: [/blog/harvest-tisk-tisk](/blog/harvest-tisk-tisk)  
> Official docs: https://www.kimai.org/documentation/docker-compose.html

## Quick Kimai (Docker Compose) Setup

1) Create a folder and add these two files:

**`.env`**
```bash
DATABASE_NAME=kimai
DATABASE_USER=kimai
DATABASE_PASSWORD=change-me
DATABASE_ROOT_PASSWORD=change-me-too

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-now
```

**`docker-compose.yml`**
```yaml
services:
  sqldb:
    image: mysql:8.3
    volumes:
      - ./mysql:/var/lib/mysql
    environment:
      MYSQL_DATABASE: ${DATABASE_NAME}
      MYSQL_USER: ${DATABASE_USER}
      MYSQL_PASSWORD: ${DATABASE_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DATABASE_ROOT_PASSWORD}
    command: --default-storage-engine innodb
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin -p$$MYSQL_ROOT_PASSWORD ping -h localhost"]
      interval: 20s
      start_period: 10s
      timeout: 10s
      retries: 3

  kimai:
    image: kimai/kimai2:apache
    depends_on:
      - sqldb
    volumes:
      - ./data:/opt/kimai/var/data
      - ./plugins:/opt/kimai/var/plugins
    ports:
      - "8001:8001"
    environment:
      ADMINMAIL: ${ADMIN_EMAIL}
      ADMINPASS: ${ADMIN_PASSWORD}
      DATABASE_URL: "mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@sqldb/${DATABASE_NAME}?charset=utf8mb4&serverVersion=8.3.0"
    restart: unless-stopped
```

2) Start it:
```bash
docker compose up -d
```

3) Open it:
- http://localhost:8001
- Login: `${ADMIN_EMAIL}` / `${ADMIN_PASSWORD}`
