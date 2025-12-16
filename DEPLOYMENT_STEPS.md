# Kroky pro nasazení změn VAT nastavení (Deployment Steps)

## Pro zobrazení změn na webu je potřeba:

### 1. Backend - Zastavit server a znovu spustit
```bash
# Zastavte běžící backend server (Ctrl+C)
cd /home/runner/work/Fakturace/Fakturace

# Nainstalujte závislosti (pokud ještě nebyly)
npm install

# Spusťte migrace automaticky při startu serveru
npm run dev
# NEBO pro produkci:
npm run build
npm start
```

**Důležité:** Migrace se spustí automaticky při startu serveru (po 1 sekundě).
Zkontrolujte výstup konzole, měli byste vidět:
```
Adding is_vat_payer column to users table...
is_vat_payer column added successfully to users table
Removing is_vat_payer column from clients table...
is_vat_payer column removed successfully from clients table
All migrations completed successfully
```

### 2. Frontend - Rebuild a refresh

```bash
cd client

# Nainstalujte závislosti (pokud ještě nebyly)
npm install

# Buildněte frontend
npm run build

# Spusťte frontend development server
npm start
```

### 3. Browser - Vyčistěte cache

Po restartu serveru:
1. Otevřete aplikaci v prohlížeči
2. Stiskněte **Ctrl+Shift+R** (Windows/Linux) nebo **Cmd+Shift+R** (Mac)
   - Toto vynutí hard refresh a vymaže cache
3. Nebo v Developer Tools (F12):
   - Otevřete Network tab
   - Zaškrtněte "Disable cache"
   - Obnovte stránku

## Kde najít změny:

### ✅ PŘIDÁNO: Nastavení uživatele
**Cesta:** Nastavení → ⚙️ Nastavení profilu → Základní údaje

V sekci "Základní údaje" nyní najdete:
```
☑ Plátce DPH
Pokud jste plátcem DPH, bude DPH zobrazeno na všech vašich fakturách.
```

### ❌ ODSTRANĚNO: Formulář klienta
**Cesta:** Klienti → Nový klient / Upravit klienta

Checkbox "Plátce DPH" byl **odstraněn** z formuláře klienta.
Nyní tam najdete pouze:
- IČO, DIČ
- Název firmy
- Adresa, Město, PSČ
- Email, Telefon

## Testování změn:

1. **Přihlaste se do aplikace**
2. **Jděte do Nastavení** (ikona ⚙️ v navigaci)
3. **Zkontrolujte sekci "Základní údaje"**
   - Měli byste vidět nový checkbox "Plátce DPH"
   - Zaškrtněte/odškrtněte podle vašeho VAT statusu
   - Klikněte "💾 Uložit změny"
4. **Jděte do Klientů**
   - Vytvořte nového klienta nebo upravte existujícího
   - Checkbox "Plátce DPH" by tam **NEMĚL** být
5. **Vygenerujte fakturu**
   - Vytvořte fakturu pro klienta
   - Vygenerujte PDF
   - VAT kalkulace by měla odpovídat vašemu VAT statusu z Nastavení

## Troubleshooting:

### Změny stále nejsou vidět?

1. **Zkontrolujte console output** serveru:
   ```bash
   # Měli byste vidět:
   Adding is_vat_payer column to users table...
   is_vat_payer column added successfully to users table
   ```

2. **Zkontrolujte databázi** (SQLite):
   ```bash
   sqlite3 fakturace.db "PRAGMA table_info(users);"
   # Měli byste vidět sloupec: is_vat_payer
   
   sqlite3 fakturace.db "PRAGMA table_info(clients);"
   # is_vat_payer by tam NEMĚL být
   ```

3. **Zkontrolujte build**:
   ```bash
   cd client
   ls -la build/
   # Měl by existovat build/ adresář s aktuálním časem
   ```

4. **Hard refresh** v prohlížeči:
   - Zavřete všechny taby aplikace
   - Otevřete nový incognito/private window
   - Otevřete aplikaci znovu

### Stále problémy?

Zkontrolujte tyto soubory v kódu:
- `client/src/components/Settings/Settings.tsx` - řádek 210-221 (VAT checkbox)
- `client/src/components/Clients/ClientForm.tsx` - VAT checkbox odstraněn
- `src/migrations/006_add_is_vat_payer_to_users.ts` - migrace existuje
- `src/migrations/007_remove_is_vat_payer_from_clients.ts` - migrace existuje

## Kontakt

Pokud máte stále problémy, pošlete:
1. Screenshot konzole serveru (backend)
2. Screenshot Developer Console v prohlížeči (F12)
3. Screenshot sekce Nastavení → Základní údaje
