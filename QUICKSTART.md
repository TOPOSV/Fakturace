# Rychlý Start - Fakturace

Tento průvodce vás provede prvním spuštěním aplikace Fakturace.

## Předpoklady

- Node.js 18 nebo vyšší
- PostgreSQL 14 nebo vyšší
- Git

## Instalace krok za krokem

### 1. Klonování projektu

```bash
git clone https://github.com/TOPOSV/Fakturace.git
cd Fakturace
```

### 2. Automatická instalace (Linux/macOS)

```bash
chmod +x setup.sh
./setup.sh
```

Skript vás provede instalací a konfigurací.

### 3. Manuální instalace

Pokud automatický skript nefunguje, postupujte manuálně:

#### Backend

```bash
cd backend

# Instalace závislostí
npm install

# Vytvoření konfiguračního souboru
cp .env.example .env

# Upravte .env soubor - minimálně nastavte:
# DATABASE_URL="postgresql://postgres:heslo@localhost:5432/fakturace"
# JWT_SECRET="vaše-tajné-heslo-min-32-znaků"

# Vygenerování Prisma klienta
npx prisma generate

# Vytvoření databáze (pokud neexistuje)
# V PostgreSQL:
# CREATE DATABASE fakturace;

# Spuštění migrací
npx prisma migrate dev --name init
```

#### Frontend

```bash
cd ../frontend

# Instalace závislostí
npm install

# Vytvoření konfiguračního souboru
cp .env.example .env.local

# .env.local by měl obsahovat:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Spuštění aplikace

Otevřete dva terminály:

**Terminál 1 - Backend:**
```bash
cd backend
npm run start:dev
```

Backend se spustí na `http://localhost:3001`

**Terminál 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend se spustí na `http://localhost:3000`

### 5. První přihlášení

1. Otevřete prohlížeč a přejděte na `http://localhost:3000`
2. Klikněte na "Nemáte účet? Registrujte se"
3. Vyplňte registrační formulář:
   - Email
   - Heslo (min. 6 znaků)
   - Jméno
   - Příjmení
4. Po registraci budete automaticky přihlášeni

### 6. První kroky v aplikaci

#### Vytvoření profilu firmy

1. Po přihlášení přejděte do "Nastavení"
2. Vyplňte údaje o vaší firmě:
   - Název firmy
   - IČ
   - DIČ (pokud jste plátce DPH)
   - Adresa
   - Kontaktní údaje
   - Bankovní spojení

#### Přidání prvního klienta

1. Přejděte na "Klienti"
2. Klikněte "Přidat klienta"
3. Vyplňte údaje o klientovi:
   - Typ (odběratel/dodavatel)
   - Název
   - IČ (můžete použít ARES integraci pro automatické doplnění)
   - Kontaktní údaje

#### Vytvoření první faktury

1. Přejděte na "Faktury"
2. Klikněte "Nová faktura"
3. Vyberte klienta
4. Přidejte položky faktury:
   - Popis
   - Množství
   - Jednotková cena
   - DPH sazba
5. Systém automaticky vypočítá DPH a celkovou částku
6. Uložte fakturu

## Funkce aplikace

### Dashboard
- Přehled příjmů a výdajů
- Stav faktur (uhrazené, neuhrazené, po splatnosti)
- Rychlé akce
- Statistiky

### Faktury
- Vytváření standardních faktur
- Zálohové faktury (proforma)
- Dobropisy
- Automatický výpočet DPH
- Sledování plateb
- Generování čísel faktur

### Nabídky
- Cenové nabídky pro klienty
- Konverze nabídky na zakázku
- Platnost nabídky

### Zakázky
- Správa projektů
- Timeline událostí
- Propojení s nabídkami a fakturami

### Klienti
- Evidence odběratelů a dodavatelů
- Historie fakturace
- Kontaktní údaje

### Produkty
- Katalog produktů a služeb
- Ceny a DPH sazby
- Jednotky

### Integrace
- ARES - automatické doplnění údajů firem podle IČ
- Kontrola plátcovství DPH

## Tipy pro začátek

1. **Nejdříve vytvořte profil firmy** - je potřeba pro vystavování faktur
2. **Přidejte produkty/služby** - usnadní vytváření faktur
3. **Organizujte klienty** - použijte poznámky a defaultní nastavení
4. **Sledujte dashboard** - přehled o stavu vašeho podnikání

## Časté problémy

### Backend se nespustí

**Chyba s databází:**
- Zkontrolujte, že PostgreSQL běží
- Ověřte DATABASE_URL v .env
- Spusťte: `npx prisma migrate dev`

**Port 3001 obsazený:**
```bash
# Najděte proces používající port
lsof -i :3001
# Ukončete proces nebo změňte port v .env
```

### Frontend se nespustí

**Port 3000 obsazený:**
```bash
# Změňte port
npm run dev -- -p 3001
```

### Nemohu se přihlásit

- Zkontrolujte, že backend běží
- Zkontrolujte NEXT_PUBLIC_API_URL ve frontend/.env.local
- Otevřete konzoli prohlížeče (F12) a zkontrolujte chyby

## Další zdroje

- **Úplná dokumentace**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **API dokumentace**: [backend/API.md](backend/API.md)
- **Nasazení do produkce**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **GitHub Issues**: https://github.com/TOPOSV/Fakturace/issues

## Podpora

Pokud narazíte na problém:

1. Zkontrolujte logy:
   ```bash
   # Backend
   cd backend
   npm run start:dev
   # Sledujte výstup
   
   # Frontend
   cd frontend
   npm run dev
   # Sledujte výstup
   ```

2. Vytvořte issue na GitHubu s popisem problému

## Licence

MIT - viz [LICENSE](LICENSE) soubor
