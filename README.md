# Fakturace

Webová aplikace pro fakturaci podnikatelů s podporou českého právního prostředí.

## Funkce

✅ **Bezpečné přihlášení** - Registrace a autentizace pomocí JWT tokenů
✅ **Správa faktur** - Vystavení faktur, zálohových faktur a nabídek
✅ **Automatické doplnění dat** - Vyhledávání firem podle IČO přes ARES API
✅ **Výpočet DPH** - Automatický výpočet daně z přidané hodnoty
✅ **Adresář klientů** - Kompletní správa kontaktů a údajů klientů
✅ **Evidence příjmů a výdajů** - Sledování všech finančních transakcí
✅ **Statistiky** - Přehledy za měsíc, kvartál a rok
✅ **Grafy a tabulky** - Vizualizace příjmů a výdajů
✅ **Export do Excelu** - Export dat (připraveno)
✅ **Notifikace o splatnosti** - Přehled nezaplacených faktur po splatnosti
🚧 **Integrace** - Příprava pro banku, e-shop a CRM systémy

## Technologie

**Backend:**
- Node.js + Express
- TypeScript
- SQLite databáze
- JWT autentizace
- ARES API integrace

**Frontend:**
- React + TypeScript
- React Router
- Axios
- Recharts (grafy)
- XLSX (export)

## Instalace a spuštění

### Požadavky
- Node.js 16+
- npm nebo yarn

### Backend

```bash
# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm run dev

# Build pro produkci
npm run build
npm start
```

Backend běží na `http://localhost:3001`

### Frontend

```bash
# Přejít do složky klienta
cd client

# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm start

# Build pro produkci
npm run build
```

Frontend běží na `http://localhost:3000`

## Konfigurace

### Backend (.env)
```
PORT=3001
JWT_SECRET=your_jwt_secret_change_this_in_production
DATABASE_PATH=./fakturace.db
CLIENT_URL=http://localhost:3000
```

### Frontend (client/.env)
```
REACT_APP_API_URL=http://localhost:3001/api
```

## API Endpointy

### Autentizace
- `POST /api/auth/register` - Registrace nového uživatele
- `POST /api/auth/login` - Přihlášení
- `GET /api/auth/profile` - Načtení profilu
- `PUT /api/auth/profile` - Aktualizace profilu

### Klienti
- `GET /api/clients` - Seznam klientů
- `GET /api/clients/:id` - Detail klienta
- `POST /api/clients` - Vytvoření klienta
- `PUT /api/clients/:id` - Aktualizace klienta
- `DELETE /api/clients/:id` - Smazání klienta
- `GET /api/clients/lookup/:ico` - Vyhledání firmy podle IČO

### Faktury
- `GET /api/invoices` - Seznam faktur
- `GET /api/invoices/:id` - Detail faktury
- `POST /api/invoices` - Vytvoření faktury
- `PUT /api/invoices/:id` - Aktualizace faktury
- `DELETE /api/invoices/:id` - Smazání faktury

### Transakce
- `GET /api/transactions` - Seznam transakcí
- `POST /api/transactions` - Vytvoření transakce
- `PUT /api/transactions/:id` - Aktualizace transakce
- `DELETE /api/transactions/:id` - Smazání transakce

### Statistiky
- `GET /api/stats/statistics` - Statistiky za období
- `GET /api/stats/dashboard` - Data pro dashboard

## Struktura projektu

```
fakturace/
├── src/                    # Backend zdrojové kódy
│   ├── config/            # Konfigurace (databáze)
│   ├── controllers/       # API kontrolery
│   ├── middleware/        # Middleware (autentizace)
│   ├── models/            # Datové modely
│   ├── routes/            # API routy
│   ├── utils/             # Pomocné funkce
│   └── index.ts           # Hlavní soubor serveru
├── client/                # Frontend aplikace
│   ├── src/
│   │   ├── components/   # React komponenty
│   │   ├── contexts/     # React kontexty
│   │   ├── services/     # API volání
│   │   └── types/        # TypeScript typy
└── README.md
```

## Vývoj

### Přidání nových funkcí
1. Backend: Vytvořit controller, route a přidat do `src/index.ts`
2. Frontend: Vytvořit komponentu a přidat route do `App.tsx`
3. Aktualizovat typy v `client/src/types/index.ts`

### Databáze
Databáze se automaticky vytvoří při prvním spuštění serveru. Schema je definováno v `src/config/database.ts`.

## Plánované funkce

- 📄 PDF generování faktur
- 📧 Email notifikace
- 🏦 Integrace s bankou (FIO, ČSOB)
- 🛒 Integrace s e-shopy
- 👥 CRM integrace
- 📱 Mobilní aplikace
- 🌍 Vícejazyčná podpora

## Licence

MIT

## Autor

TOPOSV
