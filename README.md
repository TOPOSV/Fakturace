# Fakturace - Webový fakturační systém

Komplexní webový fakturační systém pro OSVČ a malé firmy s automatizací a integrací.

## 🎯 Hlavní funkce

- **Správa dokladů**: Faktury, zálohové faktury, cenové nabídky
- **Automatizace**: Doplňování dat z ARES/VIES, kontrola solventnosti, výpočet DPH
- **Evidence**: Kompletní přehled příjmů a výdajů
- **Integrace**: Bankovní API, e-shop, CRM, Dativery, Integroid
- **Přehledy**: Grafy, statistiky, exporty

## 📁 Struktura projektu

```
Fakturace/
├── frontend/          # Next.js frontend (React + TypeScript + Tailwind)
├── backend/          # NestJS backend (REST API)
│   └── prisma/      # Database schema and migrations
└── README.md
```

## 🚀 Technologie

### Frontend
- Next.js 15 + React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication

## 📦 Instalace

### Požadavky
- Node.js 18+
- PostgreSQL 14+
- npm nebo yarn

### Kroky instalace

1. **Klonování repository**
```bash
git clone https://github.com/TOPOSV/Fakturace.git
cd Fakturace
```

2. **Instalace backend**
```bash
cd backend
npm install
```

3. **Nastavení databáze**
```bash
# Upravte .env soubor s přístupem k databázi
DATABASE_URL="postgresql://user:password@localhost:5432/fakturace"

# Spuštění migrace
npx prisma migrate dev
```

4. **Instalace frontend**
```bash
cd ../frontend
npm install
```

5. **Spuštění aplikace**

Backend (port 3001):
```bash
cd backend
npm run start:dev
```

Frontend (port 3000):
```bash
cd frontend
npm run dev
```

## 🗃️ Datový model

### Hlavní entity
- **User** - Uživatelé systému
- **Company** - Nastavení firmy
- **Client** - Adresář odběratelů/dodavatelů
- **Invoice** - Faktury (standardní, zálohové, dobropisy)
- **InvoiceItem** - Položky faktur
- **Offer** - Cenové nabídky
- **Order** - Zakázky/projekty
- **Payment** - Platby
- **Product** - Produkty/služby
- **BankAccount** - Bankovní účty
- **IntegrationSettings** - Nastavení integrací

## 🧩 Moduly

### 2.1 Tvorba dokladů
- Vytváření faktur, zálohových faktur, nabídek
- Automatické doplnění z ARES/VIES
- Kontrola solventnosti
- Výpočet DPH
- Generování PDF

### 2.2 Adresář kontaktů
- Evidence odběratelů a dodavatelů
- Historie fakturace
- Poznámky a nastavení

### 2.3 Zakázky
- Správa zakázek od nabídky po úhradu
- Sledování stavů
- Časová osa

### 2.4 Integrace
- Bankovní API - automatické párování plateb
- E-shop webhooky
- CRM synchronizace
- Dativery, Integroid

### 2.5 Přehledy
- Dashboard s přehledy
- Grafy příjmů a výdajů
- Výstrahy (DPH, dlužníci)
- Export dat (CSV, XLSX, PDF)

## 🔒 Bezpečnost

- JWT autentizace
- Bcrypt pro hesla
- Role-based access control
- Input validace (class-validator)

## 📝 API Dokumentace

API běží na `http://localhost:3001/api`

Hlavní endpointy:
- `/auth` - Autentizace
- `/invoices` - Správa faktur
- `/clients` - Správa klientů
- `/offers` - Cenové nabídky
- `/orders` - Zakázky
- `/payments` - Platby
- `/dashboard` - Přehledy a statistiky

## 🧪 Testování

```bash
# Backend unit testy
cd backend
npm run test

# E2E testy
npm run test:e2e

# Frontend testy
cd ../frontend
npm run test
```

## 🤝 Přispívání

1. Fork projektu
2. Vytvořte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit změny (`git commit -m 'Add some AmazingFeature'`)
4. Push do branch (`git push origin feature/AmazingFeature`)
5. Otevřete Pull Request

## 📄 Licence

Tento projekt je licencován pod MIT licencí.

## 👥 Autoři

- TOPOSV

## 🔮 Roadmap

- [ ] Základní CRUD pro všechny entity
- [ ] ARES/VIES integrace
- [ ] PDF generování
- [ ] Bankovní integrace
- [ ] Dashboard a grafy
- [ ] Automatické upomínky
- [ ] E-shop webhooky
- [ ] CRM integrace
- [ ] Mobilní aplikace