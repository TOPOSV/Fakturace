# Deployment Guide - Fakturace

## Přehled

Tato příručka popisuje nasazení aplikace Fakturace do produkčního prostředí.

## Požadavky

- Node.js 18+ 
- PostgreSQL 14+
- SSL certifikát (pro HTTPS)
- Domain name
- Min. 1GB RAM
- Min. 10GB disk space

## Možnosti nasazení

### 1. Tradiční VPS/Server

### 2. Cloud platformy
- Vercel (Frontend)
- Railway / Heroku (Backend + DB)
- DigitalOcean / AWS / Azure

### 3. Docker + Docker Compose

## Nasazení na VPS (Ubuntu 22.04)

### 1. Příprava serveru

```bash
# Aktualizace systému
sudo apt update && sudo apt upgrade -y

# Instalace Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalace PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalace Nginx
sudo apt install -y nginx

# Instalace PM2 (process manager)
sudo npm install -g pm2
```

### 2. Nastavení PostgreSQL

```bash
# Přepnutí na postgres uživatele
sudo -u postgres psql

# Vytvoření databáze a uživatele
CREATE DATABASE fakturace;
CREATE USER fakturace_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE fakturace TO fakturace_user;
\q

# Povolení vzdáleného přístupu (volitelné)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Změňte: listen_addresses = 'localhost'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Přidejte: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

### 3. Nasazení Backend

```bash
# Klonování repository
git clone https://github.com/TOPOSV/Fakturace.git
cd Fakturace/backend

# Instalace závislostí
npm install --production

# Vytvoření .env souboru
cat > .env << EOF
DATABASE_URL="postgresql://fakturace_user:STRONG_PASSWORD@localhost:5432/fakturace"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRATION="7d"
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://yourdomain.com"
EOF

# Spuštění migrací
npx prisma migrate deploy
npx prisma generate

# Build aplikace
npm run build

# Spuštění s PM2
pm2 start dist/main.js --name fakturace-backend
pm2 save
pm2 startup
```

### 4. Nasazení Frontend

```bash
cd ../frontend

# Instalace závislostí
npm install

# Vytvoření .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_NAME=Fakturace
EOF

# Build aplikace
npm run build

# Spuštění s PM2
pm2 start npm --name fakturace-frontend -- start
pm2 save
```

### 5. Konfigurace Nginx

```bash
sudo nano /etc/nginx/sites-available/fakturace
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktivace konfigurace
sudo ln -s /etc/nginx/sites-available/fakturace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certifikát (Let's Encrypt)

```bash
# Instalace Certbot
sudo apt install -y certbot python3-certbot-nginx

# Získání certifikátu
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Nasazení s Docker

### 1. Vytvoření Dockerfile pro Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001

CMD ["node", "dist/main"]
```

### 2. Dockerfile pro Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_DB: fakturace
      POSTGRES_USER: fakturace_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: postgresql://fakturace_user:${DB_PASSWORD}@postgres:5432/fakturace
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: 3001
    depends_on:
      - postgres
    ports:
      - "3001:3001"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

```bash
# Spuštění
docker-compose up -d

# Spuštění migrací
docker-compose exec backend npx prisma migrate deploy
```

## Nasazení na Cloud platformy

### Vercel (Frontend)

1. Připojte GitHub repository
2. Nastavte Build Command: `npm run build`
3. Output Directory: `.next`
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL`

### Railway (Backend + DB)

1. Vytvořte nový projekt
2. Přidejte PostgreSQL database
3. Přidejte backend service z GitHub
4. Nastavte environment variables
5. Deploy command: `npm run build && npx prisma migrate deploy && npm run start:prod`

## Monitoring a údržba

### Logy

```bash
# PM2 logy
pm2 logs fakturace-backend
pm2 logs fakturace-frontend

# Nginx logy
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logy
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Zálohy databáze

```bash
# Ruční záloha
pg_dump -U fakturace_user fakturace > backup_$(date +%Y%m%d).sql

# Automatická záloha (cron)
0 2 * * * pg_dump -U fakturace_user fakturace > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Aktualizace aplikace

```bash
# Zastavení aplikace
pm2 stop fakturace-backend fakturace-frontend

# Pull změn
cd /path/to/Fakturace
git pull

# Backend
cd backend
npm install
npm run build
npx prisma migrate deploy

# Frontend
cd ../frontend
npm install
npm run build

# Restart
pm2 restart fakturace-backend fakturace-frontend
```

## Bezpečnost v produkci

### Checklist

- [ ] Silné heslo pro databázi
- [ ] Náhodný JWT_SECRET (min 32 znaků)
- [ ] HTTPS certifikát (Let's Encrypt)
- [ ] Firewall (ufw) nastavený
- [ ] PostgreSQL přístup pouze z localhost
- [ ] Regular backups nastaveny
- [ ] PM2 auto-restart nakonfigurováno
- [ ] Nginx rate limiting
- [ ] Security headers v Nginx
- [ ] Regular security updates

### Nginx Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Troubleshooting

### Backend nereaguje

```bash
pm2 restart fakturace-backend
pm2 logs fakturace-backend --lines 100
```

### Databáze nedostupná

```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### SSL certifikát vypršel

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Kontakt a podpora

Pro reportování problémů vytvořte issue na GitHub: https://github.com/TOPOSV/Fakturace/issues
