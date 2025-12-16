# Kde najít změny VAT nastavení / Where to Find VAT Setting Changes

## 🎯 ZMĚNA 1: Nový checkbox v Nastavení (Settings)

### Kde:
```
Navigace → Nastavení (⚙️) → Základní údaje
```

### Co byste měli vidět:

```
╔═══════════════════════════════════════════════════════════╗
║  ⚙️ Nastavení profilu                                     ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Základní údaje                                           ║
║  ─────────────────────────────────────────────────────    ║
║                                                           ║
║  Název společnosti *     [____________________]           ║
║                                                           ║
║  IČO                     [____________________]           ║
║                                                           ║
║  DIČ                     [____________________]           ║
║                                                           ║
║  Telefon                 [____________________]           ║
║                                                           ║
║  ☑ Plátce DPH     👈 NOVÝ CHECKBOX TADY!                 ║
║  Pokud jste plátcem DPH, bude DPH zobrazeno               ║
║  na všech vašich fakturách.                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Umístění v kódu:**
- Soubor: `client/src/components/Settings/Settings.tsx`
- Řádky: 210-221

---

## 🎯 ZMĚNA 2: Odstraněný checkbox z Klientů (Clients)

### Kde:
```
Navigace → Klienti → Nový klient / Upravit klienta
```

### PŘED změnou:
```
╔═══════════════════════════════════════════════════════════╗
║  Nový klient / Upravit klienta                            ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  IČO    [________]  [Vyhledat]    DIČ  [____________]    ║
║                                                           ║
║  Název firmy *  [_________________________________]       ║
║                                                           ║
║  ... další pole ...                                       ║
║                                                           ║
║  ☑ Plátce DPH     👈 TENTO CHECKBOX BYL ODSTRANĚN        ║
║  Pokud je klient plátcem DPH...                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### PO změně:
```
╔═══════════════════════════════════════════════════════════╗
║  Nový klient / Upravit klienta                            ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  IČO    [________]  [Vyhledat]    DIČ  [____________]    ║
║                                                           ║
║  Název firmy *  [_________________________________]       ║
║                                                           ║
║  Adresa         [_________________________________]       ║
║                                                           ║
║  Město  [____________]    PSČ  [______]                  ║
║                                                           ║
║  Email  [_________________________________]               ║
║                                                           ║
║  Telefon [_________________________________]              ║
║                                                           ║
║  👈 CHECKBOX "Plátce DPH" NENÍ!                          ║
║                                                           ║
║  [Zrušit]  [Uložit]                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Umístění v kódu:**
- Soubor: `client/src/components/Clients/ClientForm.tsx`
- Checkbox byl odstraněn (neexistují žádné reference na `is_vat_payer`)

---

## ✅ Checklist pro ověření změn:

- [ ] Backend server restartován (`npm run dev`)
- [ ] Migrations se spustily úspěšně (kontrola console)
- [ ] Frontend rebuilded (`cd client && npm run build`)
- [ ] Frontend server restartován (`npm start`)
- [ ] Browser cache vyčištěn (Ctrl+Shift+R)
- [ ] Přihlášen do aplikace
- [ ] Vidím checkbox "Plátce DPH" v **Nastavení → Základní údaje**
- [ ] NEvidím checkbox "Plátce DPH" v **Klienti → Nový klient**
- [ ] Mohu uložit změnu VAT statusu v Nastavení
- [ ] PDF faktury používá můj VAT status z Nastavení

---

## 🔧 Pokud změny nevidíte:

### 1. Restartujte backend server
```bash
# Zastavte server (Ctrl+C)
cd /home/runner/work/Fakturace/Fakturace
npm run dev
```

Počkejte a sledujte console výstup. Měli byste vidět:
```
Adding is_vat_payer column to users table...
is_vat_payer column added successfully to users table
Removing is_vat_payer column from clients table...
is_vat_payer column removed successfully from clients table
All migrations completed successfully
Server is running on port 3001
```

### 2. Rebuildte a restartujte frontend
```bash
cd client
npm run build
npm start
```

### 3. Vyčistěte browser cache
- Zavřete všechny taby aplikace
- Otevřete prohlížeč v **incognito/private mode**
- Otevřete aplikaci: `http://localhost:3000`
- Přihlaste se

### 4. Zkontrolujte migrace v databázi
```bash
sqlite3 fakturace.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='users';"
# Měli byste vidět: is_vat_payer INTEGER DEFAULT 1

sqlite3 fakturace.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='clients';"
# is_vat_payer by tam NEMĚL být
```

---

## 📸 Screenshot lokací (očekávané pozice):

### Nastavení - s checkboxem:
```
Aplikace URL: http://localhost:3000/settings
Sekce: "Základní údaje"
Hledejte: ☑ Plátce DPH
Pod: Pole "Telefon"
```

### Klienti - bez checkboxu:
```
Aplikace URL: http://localhost:3000/clients
Klikněte: "Nový klient" nebo upravte existujícího
Kontrola: Checkbox "Plátce DPH" by tam NEMĚL být
```

---

## 💡 Tip:

Pokud používáte **development mode** (`npm run dev`), změny v kódu se aplikují automaticky s hot reload. Ale pro migrace databáze je potřeba **restartovat backend server**.

Pro **production mode** je potřeba buildit a restartovat oba servery.
