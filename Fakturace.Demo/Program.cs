using Fakturace.Core.Models;
using Fakturace.Core.Services;

Console.WriteLine("═══════════════════════════════════════════════════════════════");
Console.WriteLine("   Demo systému pro správu faktur - Zálohové faktury");
Console.WriteLine("═══════════════════════════════════════════════════════════════\n");

var invoiceService = new InvoiceService();
var pdfService = new SimplePdfService();

// ═══════════════════════════════════════════════════════════════
// 1. Vytvoření běžné faktury
// ═══════════════════════════════════════════════════════════════
Console.WriteLine("1️⃣  VYTVOŘENÍ BĚŽNÉ FAKTURY");
Console.WriteLine("───────────────────────────────────────────────────────────────");

var regularInvoice = new Invoice
{
    Type = InvoiceType.Regular,
    IssueDate = DateTime.Now,
    DueDate = DateTime.Now.AddDays(14),
    Status = InvoiceStatus.Issued,
    CustomerId = "CUST001",
    CustomerName = "ACME Corporation s.r.o.",
    CustomerAddress = "Václavské náměstí 1, 110 00 Praha 1",
    CustomerCompanyId = "12345678",
    CustomerVatId = "CZ12345678",
    Currency = "CZK",
    Items = new List<InvoiceItem>
    {
        new InvoiceItem
        {
            Description = "Konzultační služby - IT",
            Quantity = 20,
            Unit = "hod",
            UnitPrice = 1500m,
            VatRate = 21m
        },
        new InvoiceItem
        {
            Description = "Softwarová licence",
            Quantity = 1,
            Unit = "ks",
            UnitPrice = 5000m,
            VatRate = 21m
        }
    }
};

regularInvoice = await invoiceService.CreateInvoiceAsync(regularInvoice);
Console.WriteLine($"✓ Vytvořena běžná faktura: {regularInvoice.InvoiceNumber}");
Console.WriteLine($"  Celkem k úhradě: {regularInvoice.TotalAmount:N2} {regularInvoice.Currency}");
Console.WriteLine($"  Splatnost: {regularInvoice.DueDate:dd.MM.yyyy}\n");

// ═══════════════════════════════════════════════════════════════
// 2. Vytvoření zálohové faktury
// ═══════════════════════════════════════════════════════════════
Console.WriteLine("2️⃣  VYTVOŘENÍ ZÁLOHOVÉ FAKTURY");
Console.WriteLine("───────────────────────────────────────────────────────────────");

var advanceInvoice = new Invoice
{
    Type = InvoiceType.Advance,
    IssueDate = DateTime.Now,
    DueDate = DateTime.Now.AddDays(7),
    Status = InvoiceStatus.Issued,
    CustomerId = "CUST002",
    CustomerName = "XYZ Trading a.s.",
    CustomerAddress = "Hlavní třída 100, 602 00 Brno",
    CustomerCompanyId = "87654321",
    CustomerVatId = "CZ87654321",
    Currency = "CZK",
    AutoCreateRegularInvoiceOnPayment = true,
    Items = new List<InvoiceItem>
    {
        new InvoiceItem
        {
            Description = "Vývoj webové aplikace - záloha 50%",
            Quantity = 1,
            Unit = "ks",
            UnitPrice = 50000m,
            VatRate = 21m
        }
    }
};

advanceInvoice = await invoiceService.CreateInvoiceAsync(advanceInvoice);
Console.WriteLine($"✓ Vytvořena zálohová faktura: {advanceInvoice.InvoiceNumber}");
Console.WriteLine($"  Typ: ZÁLOHOVÁ (není daňový doklad)");
Console.WriteLine($"  Celkem k úhradě: {advanceInvoice.TotalAmount:N2} {advanceInvoice.Currency}");
Console.WriteLine($"  Splatnost: {advanceInvoice.DueDate:dd.MM.yyyy}");
Console.WriteLine($"  Auto-vytvoření běžné faktury: {(advanceInvoice.AutoCreateRegularInvoiceOnPayment ? "ANO" : "NE")}\n");

// ═══════════════════════════════════════════════════════════════
// 3. Demonstrace oddělených číselných řad
// ═══════════════════════════════════════════════════════════════
Console.WriteLine("3️⃣  ODDĚLENÉ ČÍSELNÉ ŘADY");
Console.WriteLine("───────────────────────────────────────────────────────────────");

var regularNumber = await invoiceService.GenerateInvoiceNumberAsync(InvoiceType.Regular, 2025);
var advanceNumber = await invoiceService.GenerateInvoiceNumberAsync(InvoiceType.Advance, 2025);

Console.WriteLine($"✓ Běžné faktury: prefix 'F' - příklad: {regularNumber}");
Console.WriteLine($"✓ Zálohové faktury: prefix 'ZF' - příklad: {advanceNumber}\n");

// ═══════════════════════════════════════════════════════════════
// 4. Označení zálohové faktury jako zaplacené
// ═══════════════════════════════════════════════════════════════
Console.WriteLine("4️⃣  OZNAČENÍ ZÁLOHOVÉ FAKTURY JAKO ZAPLACENÉ");
Console.WriteLine("───────────────────────────────────────────────────────────────");

Console.WriteLine($"➤ Označuji zálohovou fakturu {advanceInvoice.InvoiceNumber} jako zaplacenou...");
advanceInvoice = await invoiceService.MarkAsPaidAsync(advanceInvoice.Id);

Console.WriteLine($"✓ Faktura označena jako zaplacená");
Console.WriteLine($"✓ Automaticky vytvořena běžná faktura: {advanceInvoice.RegularInvoiceId != null}");

if (advanceInvoice.RegularInvoiceId.HasValue)
{
    var createdRegularInvoice = await invoiceService.GetInvoiceAsync(advanceInvoice.RegularInvoiceId.Value);
    if (createdRegularInvoice != null)
    {
        Console.WriteLine($"  → Číslo běžné faktury: {createdRegularInvoice.InvoiceNumber}");
        Console.WriteLine($"  → Propojeno se zálohovou: {createdRegularInvoice.AdvanceInvoiceId}");
        Console.WriteLine($"  → Poznámka: {createdRegularInvoice.Note}");
    }
}
Console.WriteLine();

// ═══════════════════════════════════════════════════════════════
// 5. Vytvoření další zálohové faktury pro demonstraci storna
// ═══════════════════════════════════════════════════════════════
Console.WriteLine("5️⃣  STORNOVÁNÍ ZÁLOHOVÉ FAKTURY");
Console.WriteLine("───────────────────────────────────────────────────────────────");

var advanceToCancel = new Invoice
{
    Type = InvoiceType.Advance,
    IssueDate = DateTime.Now,
    DueDate = DateTime.Now.AddDays(7),
    Status = InvoiceStatus.Issued,
    CustomerId = "CUST003",
    CustomerName = "Test Company s.r.o.",
    CustomerAddress = "Testovací 1, Praha",
    CustomerCompanyId = "11111111",
    Currency = "CZK",
    Items = new List<InvoiceItem>
    {
        new InvoiceItem
        {
            Description = "Testovací položka",
            Quantity = 1,
            Unit = "ks",
            UnitPrice = 10000m,
            VatRate = 21m
        }
    }
};

advanceToCancel = await invoiceService.CreateInvoiceAsync(advanceToCancel);
Console.WriteLine($"✓ Vytvořena zálohová faktura: {advanceToCancel.InvoiceNumber}");

// Stornování
advanceToCancel = await invoiceService.CancelInvoiceAsync(advanceToCancel.Id);
Console.WriteLine($"✓ Faktura stornována - stav: {advanceToCancel.Status}");
Console.WriteLine($"  ℹ  Zálohová faktura může být stornována místo smazání");
Console.WriteLine($"  ℹ  Historie zůstává u zákazníka zachována\n");

// ═══════════════════════════════════════════════════════════════
// 6. Generování PDF pro zálohovou fakturu
// ═══════════════════════════════════════════════════════════════
Console.WriteLine("6️⃣  GENEROVÁNÍ PDF DOKUMENTŮ");
Console.WriteLine("───────────────────────────────────────────────────────────────");

var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "faktury");
Directory.CreateDirectory(outputDir);

// PDF běžné faktury
var regularPdfPath = Path.Combine(outputDir, $"{regularInvoice.InvoiceNumber}.html");
await pdfService.SavePdfToFileAsync(regularInvoice, regularPdfPath);
Console.WriteLine($"✓ PDF běžné faktury: {regularPdfPath}");

// PDF zálohové faktury
var advancePdfPath = Path.Combine(outputDir, $"{advanceInvoice.InvoiceNumber}.html");
await pdfService.SavePdfToFileAsync(advanceInvoice, advancePdfPath);
Console.WriteLine($"✓ PDF zálohové faktury: {advancePdfPath}");
Console.WriteLine($"  ⚠  Obsahuje upozornění: 'NENÍ daňový doklad'\n");

// ═══════════════════════════════════════════════════════════════
// 7. Přehled všech faktur
// ═══════════════════════════════════════════════════════════════
Console.WriteLine("7️⃣  PŘEHLED VŠECH FAKTUR");
Console.WriteLine("───────────────────────────────────────────────────────────────");

var allInvoices = await invoiceService.GetAllInvoicesAsync();
Console.WriteLine($"Celkem faktur v systému: {allInvoices.Count()}\n");

Console.WriteLine("Typ           | Číslo faktury     | Zákazník          | Částka      | Stav");
Console.WriteLine("──────────────|──────────────────|───────────────────|─────────────|────────────");

foreach (var inv in allInvoices.OrderBy(i => i.CreatedAt))
{
    var typeLabel = inv.Type == InvoiceType.Advance ? "ZÁLOHOVÁ" : "BĚŽNÁ";
    var statusLabel = inv.Status switch
    {
        InvoiceStatus.Issued => "Vystavená",
        InvoiceStatus.Paid => "Zaplacená",
        InvoiceStatus.Cancelled => "Stornovaná",
        _ => inv.Status.ToString()
    };
    
    Console.WriteLine($"{typeLabel,-13} | {inv.InvoiceNumber,-16} | {inv.CustomerName.Substring(0, Math.Min(17, inv.CustomerName.Length)),-17} | {inv.TotalAmount,11:N2} | {statusLabel}");
}

Console.WriteLine("\n═══════════════════════════════════════════════════════════════");
Console.WriteLine("✓ Demo úspěšně dokončeno!");
Console.WriteLine("═══════════════════════════════════════════════════════════════");

Console.WriteLine("\nKlíčové vlastnosti implementace:");
Console.WriteLine("  • Oddělené číselné řady pro běžné (F) a zálohové (ZF) faktury");
Console.WriteLine("  • Automatické vytvoření běžné faktury po zaplacení zálohy");
Console.WriteLine("  • Možnost stornování místo smazání pro zachování historie");
Console.WriteLine("  • Propojení mezi zálohovou a běžnou fakturou");
Console.WriteLine("  • Speciální označení v PDF pro zálohové faktury");
Console.WriteLine("  • Upozornění, že zálohová faktura není daňový doklad");
