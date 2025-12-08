# Vývojářská dokumentace - Fakturace

## Struktura projektu

```
Fakturace/
├── backend/              # NestJS backend
│   ├── prisma/          # Databázové schéma a migrace
│   │   └── schema.prisma
│   ├── src/
│   │   ├── auth/        # Autentizace a autorizace
│   │   ├── companies/   # Správa firem
│   │   ├── clients/     # Správa klientů
│   │   ├── invoices/    # Faktury
│   │   ├── offers/      # Nabídky
│   │   ├── orders/      # Zakázky
│   │   ├── products/    # Produkty a služby
│   │   ├── dashboard/   # Dashboard a statistiky
│   │   ├── integrations/# Externí integrace (ARES, banky, atd.)
│   │   └── prisma/      # Prisma service
│   └── API.md           # API dokumentace
├── frontend/            # Next.js frontend
│   └── src/
│       ├── app/         # Next.js App Router stránky
│       ├── components/  # Reusable komponenty
│       └── lib/         # Utility funkce
└── README.md
```

## Technologie

### Backend
- **Framework**: NestJS 11
- **ORM**: Prisma
- **Databáze**: PostgreSQL 14+
- **Autentizace**: JWT (jsonwebtoken + @nestjs/jwt)
- **Validace**: class-validator, class-transformer
- **Password Hashing**: bcrypt

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Custom komponenty + Radix UI primitives
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Instalace pro vývoj

### 1. Nastavení databáze

```bash
# PostgreSQL musí být nainstalován a běžící
# Vytvořte novou databázi
createdb fakturace

# Nebo pomocí psql:
psql -U postgres
CREATE DATABASE fakturace;
```

### 2. Backend Setup

```bash
cd backend

# Nainstalujte závislosti
npm install

# Zkopírujte .env.example do .env
cp .env.example .env

# Upravte .env soubor s vaší konfigurací
# Minimálně nastavte DATABASE_URL a JWT_SECRET

# Vygenerujte Prisma client
npx prisma generate

# Spusťte databázové migrace
npx prisma migrate dev --name init

# Spusťte backend (development mode s hot reload)
npm run start:dev

# Backend poběží na http://localhost:3001/api
```

### 3. Frontend Setup

```bash
cd frontend

# Nainstalujte závislosti
npm install

# Zkopírujte .env.example do .env.local
cp .env.example .env.local

# Spusťte frontend (development mode)
npm run dev

# Frontend poběží na http://localhost:3000
```

## Databázové schéma

### Hlavní entity

#### User
- Uživatelské účty
- Role-based access control
- Bcrypt hashovaná hesla

#### Company
- Nastavení firmy uživatele
- IČ, DIČ, bankovní údaje
- Defaultní hodnoty pro faktury

#### Client
- Odběratelé a dodavatelé
- Historie transakcí
- Kontaktní informace

#### Invoice
- Faktury (standard, proforma, dobropis)
- Automatický výpočet DPH
- Sledování plateb a stavů

#### Offer
- Cenové nabídky
- Konverze na zakázky
- Platnost nabídky

#### Order
- Zakázky/projekty
- Timeline událostí
- Propojení s nabídkami a fakturami

#### Product
- Produkty a služby
- Ceny a DPH sazby
- Jednotky

## API Endpointy

Kompletní API dokumentace je v `backend/API.md`

### Autentizace
- `POST /api/auth/register` - Registrace nového uživatele
- `POST /api/auth/login` - Přihlášení
- `GET /api/auth/me` - Získání informací o přihlášeném uživateli

### Faktury
- `GET /api/invoices` - Seznam faktur
- `POST /api/invoices` - Vytvoření faktury
- `GET /api/invoices/:id` - Detail faktury
- `PATCH /api/invoices/:id` - Aktualizace faktury
- `DELETE /api/invoices/:id` - Smazání faktury
- `GET /api/invoices/stats` - Statistiky faktur

### Dashboard
- `GET /api/dashboard/overview` - Přehled všech klíčových metrik
- `GET /api/dashboard/revenue/monthly` - Měsíční příjmy
- `GET /api/dashboard/clients/top` - Top klienti podle obratu
- `GET /api/dashboard/invoices/overdue` - Faktury po splatnosti

## Vývojové příkazy

### Backend

```bash
# Development s hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Spuštění testů
npm run test

# E2E testy
npm run test:e2e

# Lint
npm run lint

# Prisma Studio (GUI pro databázi)
npx prisma studio

# Vytvoření nové migrace
npx prisma migrate dev --name migration_name

# Reset databáze (POZOR: smaže všechna data!)
npx prisma migrate reset
```

### Frontend

```bash
# Development server
npm run dev

# Production build
npm run build

# Production preview
npm run start

# Lint
npm run lint

# Type checking
npx tsc --noEmit
```

## Testování

### Manuální testování API

1. Spusťte backend
2. Použijte nástroje jako:
   - Postman
   - Insomnia
   - curl
   - VS Code REST Client

Příklad curl požadavku:

```bash
# Registrace
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Použijte získaný token pro autentizované požadavky
curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Přidání nové funkcionality

### 1. Backend - Nový modul

```bash
# Vytvoření nového modulu
cd backend
nest g module payments
nest g controller payments
nest g service payments

# Vytvoření DTO
mkdir src/payments/dto
touch src/payments/dto/payment.dto.ts
```

### 2. Frontend - Nová stránka

```bash
cd frontend
mkdir src/app/payments
touch src/app/payments/page.tsx
```

## Troubleshooting

### Backend se nespustí

1. Zkontrolujte, že PostgreSQL běží
2. Ověřte DATABASE_URL v .env
3. Spusťte migrace: `npx prisma migrate dev`
4. Zkontrolujte port 3001 není obsazený

### Frontend se nemůže připojit k API

1. Ověřte, že backend běží na portu 3001
2. Zkontrolujte NEXT_PUBLIC_API_URL v .env.local
3. Zkontrolujte CORS nastavení v backend/src/main.ts

### Prisma problémy

```bash
# Regenerovat Prisma client
npx prisma generate

# Vyčistit a znovu migrovat
npx prisma migrate reset
npx prisma migrate dev
```

## Best Practices

### Backend

1. **Validace**: Vždy používejte DTO s class-validator
2. **Error Handling**: Používejte NestJS HttpException
3. **Authentication**: Všechny chráněné endpointy používají JwtAuthGuard
4. **Database Queries**: Používejte Prisma transactions pro complex operations

### Frontend

1. **Client-side only**: Komponenty s localStorage používají 'use client'
2. **Error Handling**: Try-catch bloky pro API calls
3. **Loading States**: Vždy zobrazit loading state během API calls
4. **Type Safety**: Typovat API responses

## Security

### Implementované bezpečnostní opatření

1. **Password Hashing**: bcrypt s 10 salt rounds
2. **JWT Tokens**: 7 denní expirace
3. **CORS**: Nastaveno pouze pro frontend URL
4. **Input Validation**: class-validator na všech DTO
5. **SQL Injection Protection**: Prisma ORM

### Doporučení pro production

1. Používejte silné JWT_SECRET (min 32 znaků)
2. HTTPS v produkci
3. Rate limiting na API endpoints
4. Regular security updates
5. Database backups
6. Environment variables nikdy v git

## Deployment

### Backend

```bash
# Build
npm run build

# Start
npm run start:prod

# Environment variables musí být nastaveny
# DATABASE_URL, JWT_SECRET, atd.
```

### Frontend

```bash
# Build
npm run build

# Start
npm run start
```

### Docker (volitelné)

Připravte Dockerfile pro backend a frontend, docker-compose pro celý stack včetně PostgreSQL.

## Kontribuce

1. Fork repository
2. Vytvořte feature branch
3. Commitujte změny
4. Pushněte do forku
5. Vytvořte Pull Request

## Licence

MIT
