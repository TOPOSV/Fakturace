# Daňový doklad k přijaté platbě - Implementace

## Přehled
Tato funkce implementuje tisk daňového dokladu pro uhrazené zálohové faktury v souladu s českým daňovým právem.

## České zákonné požadavky
- **Zálohová faktura** není daňový doklad, ale pouze podklad k platbě
- Po obdržení platby je nutné **do 15 dnů vystavit řádný daňový doklad** k přijaté platbě
- Na zálohové faktuře je uvedeno "NENÍ daňový doklad" a DPH jen informativně

## Jak použít

### 1. Vytvoření zálohové faktury
- Vytvořte fakturu typu "Zálohová faktura"
- Na PDF bude uvedeno: **"Zálohová faktura - NENÍ daňový doklad"**

### 2. Po uhrazení zálohy
Po označení zálohové faktury jako uhrazené se zobrazí nové tlačítko:
- **Modré tlačítko 🧾** s nápisem "Tisk daňového dokladu k přijaté platbě"
- Kliknutím vytvoříte PDF daňového dokladu

### 3. Daňový doklad
Po kliknutí na tlačítko 🧾 se vygeneruje PDF s názvem:
- **"Danovy-doklad-{číslo}.pdf"**
- V hlavičce bude uvedeno: **"Daňový doklad k přijaté platbě"**
- Obsahuje stejné položky jako původní zálohová faktura
- Toto je **daňový doklad** pro účely DPH

## Technické detaily

### Změny v kódu

#### 1. PDF Generator (`client/src/utils/pdfGenerator.ts`)
```typescript
export const generateInvoicePDF = async (
  invoice: InvoiceData, 
  userData: UserData, 
  isTaxDocument: boolean = false  // NOVÝ parametr
) => {
  // Při isTaxDocument=true pro zálohové faktury:
  // - Hlavička: "Daňový doklad k přijaté platbě"
  // - Název souboru: "Danovy-doklad-{number}.pdf"
}
```

#### 2. Invoice List (`client/src/components/Invoices/InvoiceList.tsx`)
```typescript
// Nová funkce pro export daňového dokladu
const handleExportTaxDocument = async (invoice: any) => {
  // Načte data faktury a uživatele
  // Volá generateInvoicePDF s isTaxDocument=true
  await generateInvoicePDF(fullInvoice, userData, true);
};

// Nové tlačítko v akčním sloupci
{invoice.type === 'advance' && invoice.status === 'paid' && (
  <button
    onClick={() => handleExportTaxDocument(invoice)}
    className="action-btn tax-doc-btn"
    title="Tisk daňového dokladu k přijaté platbě"
    style={{ backgroundColor: '#007bff' }}
  >
    🧾
  </button>
)}
```

## Workflow

```
1. Vytvoření zálohové faktury
   ↓
   [Zálohová faktura - NENÍ daňový doklad]
   
2. Odeslání klientovi & Platba
   ↓
   [Označení jako UHRAZENO]
   
3. Tisk daňového dokladu (🧾)
   ↓
   [Daňový doklad k přijaté platbě]  ← TENTO PDF je daňový doklad
```

## Bezpečnost
✅ Prošlo CodeQL security scan bez chyb
✅ Prošlo code review bez připomínek
✅ TypeScript kompilace úspěšná

## Poznámky
- Tlačítko se zobrazuje pro **všechny uhrazené zálohové faktury**
- Daňový doklad lze vytisknout **opakovaně** (např. při ztrátě originálu)
- Není nutné vytvářet běžnou fakturu - daňový doklad je samostatný dokument
