# Fakturace - Systém pro správu faktur s podporou zálohových faktur

Systém pro vytváření a správu faktur s plnou podporou zálohových faktur (proforma invoices). Zálohové faktury jsou užitečné v případech, kdy nevíte, zda Vám zákazník služby nebo zboží opravdu zaplatí, nebo potřebujete dostat zaplaceno předem.

## 🎯 Hlavní funkce

### Zálohové faktury (Advance Invoices)
- ✅ **Oddělená číselná řada** - Zálohové faktury mají prefix `ZF`, běžné faktury prefix `F`
- ✅ **Automatické vytvoření běžné faktury** - Po zaplacení zálohy se automaticky vytvoří daňový doklad
- ✅ **Stornování místo smazání** - Zachování kompletní historie u zákazníka
- ✅ **Speciální označení v PDF** - Jasné upozornění "NENÍ daňový doklad"
- ✅ **Propojení faktur** - Zálohová a běžná faktura jsou vzájemně propojeny
- ✅ **Konfigurovatelné chování** - Možnost nastavit automatické vytvoření běžné faktury

### Běžné faktury
- ✅ Vytváření běžných daňových dokladů
- ✅ Správa položek s DPH
- ✅ Automatický výpočet částek
- ✅ Generování PDF dokumentů
- ✅ Evidence zákazníků

## 🏗️ Struktura projektu

```
Fakturace/
├── Fakturace.Core/          # Hlavní knihovna s business logikou
│   ├── Models/              # Datové modely (Invoice, InvoiceItem, enums)
│   └── Services/            # Služby (InvoiceService, PdfService)
├── Fakturace.Tests/         # Unit testy
└── Fakturace.Demo/          # Ukázková konzolová aplikace
```

## 🚀 Rychlý start

### Požadavky
- .NET 8.0 SDK nebo novější

### Sestavení projektu
```bash
dotnet build
```

### Spuštění testů
```bash
dotnet test
```

### Spuštění demo aplikace
```bash
cd Fakturace.Demo
dotnet run
```

## 📖 Použití

### 1. Vytvoření zálohové faktury

```csharp
using Fakturace.Core.Models;
using Fakturace.Core.Services;

var invoiceService = new InvoiceService();

var advanceInvoice = new Invoice
{
    Type = InvoiceType.Advance,
    IssueDate = DateTime.Now,
    DueDate = DateTime.Now.AddDays(7),
    Status = InvoiceStatus.Issued,
    CustomerName = "ACME Corporation s.r.o.",
    CustomerAddress = "Praha 1",
    CustomerCompanyId = "12345678",
    CustomerVatId = "CZ12345678",
    Currency = "CZK",
    AutoCreateRegularInvoiceOnPayment = true,  // Klíčové nastavení!
    Items = new List<InvoiceItem>
    {
        new InvoiceItem
        {
            Description = "Záloha na projekt",
            Quantity = 1,
            Unit = "ks",
            UnitPrice = 50000m,
            VatRate = 21m
        }
    }
};

var created = await invoiceService.CreateInvoiceAsync(advanceInvoice);
// Výsledek: ZF2025-000001
```

### 2. Označení jako zaplacené (s automatickým vytvořením běžné faktury)

```csharp
// Po obdržení platby
var paid = await invoiceService.MarkAsPaidAsync(advanceInvoice.Id);

// Pokud bylo nastaveno AutoCreateRegularInvoiceOnPayment = true,
// automaticky se vytvoří běžná faktura
if (paid.RegularInvoiceId.HasValue)
{
    var regularInvoice = await invoiceService.GetInvoiceAsync(paid.RegularInvoiceId.Value);
    Console.WriteLine($"Vytvořena běžná faktura: {regularInvoice.InvoiceNumber}");
    // Výsledek: F2025-000001
}
```

### 3. Manuální vytvoření běžné faktury ze zálohové

```csharp
var regularInvoice = await invoiceService.CreateRegularFromAdvanceAsync(advanceInvoiceId);
```

### 4. Stornování zálohové faktury

```csharp
// Místo smazání - zachování historie
var cancelled = await invoiceService.CancelInvoiceAsync(invoiceId);
```

### 5. Generování PDF

```csharp
var pdfService = new SimplePdfService();

// Zálohová faktura - obsahuje upozornění "NENÍ daňový doklad"
await pdfService.SavePdfToFileAsync(advanceInvoice, "zalohova-faktura.html");

// Běžná faktura - standardní daňový doklad
await pdfService.SavePdfToFileAsync(regularInvoice, "faktura.html");
```

## 🔢 Číselné řady

Systém používá oddělené číselné řady pro různé typy faktur:

- **Běžné faktury**: `F{ROK}-{ČÍSLO}` (např. F2025-000001)
- **Zálohové faktury**: `ZF{ROK}-{ČÍSLO}` (např. ZF2025-000001)

Číslování je automatické a sekvenční pro každý typ faktury zvlášť.

## 📋 Datový model

### Invoice
```csharp
public class Invoice
{
    public Guid Id { get; set; }
    public InvoiceType Type { get; set; }           // Regular / Advance
    public string InvoiceNumber { get; set; }
    public InvoiceStatus Status { get; set; }       // Draft / Issued / Paid / Cancelled
    public decimal TotalAmount { get; set; }
    
    // Propojení mezi fakturami
    public Guid? AdvanceInvoiceId { get; set; }     // Odkaz na zálohovou fakturu
    public Guid? RegularInvoiceId { get; set; }     // Odkaz na běžnou fakturu
    
    // Automatizace
    public bool AutoCreateRegularInvoiceOnPayment { get; set; }
    
    // Zákazník
    public string CustomerName { get; set; }
    public string CustomerCompanyId { get; set; }
    
    // Položky
    public List<InvoiceItem> Items { get; set; }
}
```

### InvoiceType
- `Regular` (0) - Běžná faktura (daňový doklad)
- `Advance` (1) - Zálohová faktura (není daňový doklad)

### InvoiceStatus
- `Draft` (0) - Koncept
- `Issued` (1) - Vystavená
- `Paid` (2) - Zaplacená
- `Cancelled` (3) - Stornovaná
- `Overdue` (4) - Po splatnosti

## 🧪 Testování

Projekt obsahuje komplexní sadu unit testů pokrývající všechny hlavní funkce:

```bash
dotnet test --verbosity normal
```

Testy ověřují:
- ✅ Vytváření faktur obou typů
- ✅ Oddělené číselné řady
- ✅ Automatické vytvoření běžné faktury
- ✅ Stornování faktur
- ✅ Propojení mezi fakturami
- ✅ PDF generování s správným označením
- ✅ Výpočty DPH a celkových částek

## 🎨 PDF výstupy

### Zálohová faktura
- Nadpis: **ZÁLOHOVÁ FAKTURA**
- Žluté upozornění: ⚠️ **UPOZORNĚNÍ: Toto NENÍ daňový doklad**
- Odkaz na běžnou fakturu (pokud byla vytvořena)

### Běžná faktura vytvořená ze zálohy
- Nadpis: **FAKTURA**
- Informační box s odkazem na zálohovou fakturu
- Standardní daňový doklad

## 🔐 Best practices

1. **Vždy nastavte `AutoCreateRegularInvoiceOnPayment = true`** u zálohových faktur, které chcete automaticky převést
2. **Používejte stornování místo mazání** pro zachování auditní stopy
3. **Kontrolujte propojení** mezi fakturami pomocí `AdvanceInvoiceId` a `RegularInvoiceId`
4. **Generujte PDF s upozorněním** pro zálohové faktury, aby bylo jasné, že nejsou daňovým dokladem

## 🛠️ Rozšíření do produkce

Aktuální implementace je demonstrační. Pro produkční použití doporučujeme:

1. **Databáze** - Nahradit in-memory úložiště (např. Entity Framework Core + SQL Server/PostgreSQL)
2. **PDF knihovna** - Použít profesionální knihovnu (QuestPDF, iTextSharp)
3. **Email** - Přidat automatické odesílání faktur zákazníkům
4. **API** - Vytvořit REST API pro integraci s dalšími systémy
5. **Bankovní propojení** - Automatické párování plateb podle variabilního symbolu
6. **Oprávnění** - Implementovat autentizaci a autorizaci
7. **Lokalizace** - Podpora více jazyků a měn

## 📝 Licence

Tento projekt je poskytován jako ukázková implementace.

## 🤝 Příspěvky

Projekt je otevřen pro příspěvky a vylepšení.