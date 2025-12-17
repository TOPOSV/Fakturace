using System.Text;
using Fakturace.Core.Models;

namespace Fakturace.Core.Services;

/// <summary>
/// Jednoduchá implementace generování HTML/Text reprezentace faktury
/// (V produkčním systému by se použila knihovna jako iTextSharp nebo QuestPDF)
/// </summary>
public class SimplePdfService : IPdfService
{
    /// <summary>
    /// Vygeneruje HTML reprezentaci faktury jako byte array
    /// </summary>
    public Task<byte[]> GeneratePdfAsync(Invoice invoice)
    {
        var html = GenerateHtml(invoice);
        return Task.FromResult(Encoding.UTF8.GetBytes(html));
    }
    
    /// <summary>
    /// Uloží HTML reprezentaci faktury do souboru
    /// </summary>
    public async Task SavePdfToFileAsync(Invoice invoice, string filePath)
    {
        var content = await GeneratePdfAsync(invoice);
        await File.WriteAllBytesAsync(filePath, content);
    }
    
    /// <summary>
    /// Generuje HTML reprezentaci faktury
    /// </summary>
    private string GenerateHtml(Invoice invoice)
    {
        var sb = new StringBuilder();
        
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html>");
        sb.AppendLine("<head>");
        sb.AppendLine("    <meta charset=\"utf-8\">");
        sb.AppendLine($"    <title>Faktura {invoice.InvoiceNumber}</title>");
        sb.AppendLine("    <style>");
        sb.AppendLine("        body { font-family: Arial, sans-serif; margin: 40px; }");
        sb.AppendLine("        .header { text-align: center; margin-bottom: 30px; }");
        sb.AppendLine("        .warning { background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; font-weight: bold; }");
        sb.AppendLine("        .info { margin-bottom: 20px; }");
        sb.AppendLine("        .info-section { display: inline-block; width: 45%; vertical-align: top; }");
        sb.AppendLine("        table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        sb.AppendLine("        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        sb.AppendLine("        th { background-color: #f2f2f2; }");
        sb.AppendLine("        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }");
        sb.AppendLine("        .reference { margin-top: 30px; padding: 10px; background-color: #e7f3ff; border-left: 4px solid #2196F3; }");
        sb.AppendLine("    </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        
        // Hlavička
        sb.AppendLine("    <div class=\"header\">");
        if (invoice.Type == InvoiceType.Advance)
        {
            sb.AppendLine("        <h1>ZÁLOHOVÁ FAKTURA</h1>");
        }
        else
        {
            sb.AppendLine("        <h1>FAKTURA</h1>");
        }
        sb.AppendLine($"        <h2>{invoice.InvoiceNumber}</h2>");
        sb.AppendLine("    </div>");
        
        // Varování pro zálohovou fakturu
        if (invoice.Type == InvoiceType.Advance)
        {
            sb.AppendLine("    <div class=\"warning\">");
            sb.AppendLine("        ⚠️ UPOZORNĚNÍ: Toto NENÍ daňový doklad. Zálohová faktura slouží pouze k vyžádání platby.");
            sb.AppendLine("        Daňový doklad bude vystaven až po přijetí platby.");
            sb.AppendLine("    </div>");
        }
        
        // Odkaz na zálohou/běžnou fakturu
        if (invoice.Type == InvoiceType.Regular && invoice.AdvanceInvoiceId.HasValue)
        {
            sb.AppendLine("    <div class=\"reference\">");
            sb.AppendLine($"        📄 Tato faktura byla vytvořena na základě zálohové faktury (ID: {invoice.AdvanceInvoiceId})");
            sb.AppendLine("    </div>");
        }
        else if (invoice.Type == InvoiceType.Advance && invoice.RegularInvoiceId.HasValue)
        {
            sb.AppendLine("    <div class=\"reference\">");
            sb.AppendLine($"        ✅ K této zálohové faktuře byla vytvořena běžná faktura (ID: {invoice.RegularInvoiceId})");
            sb.AppendLine("    </div>");
        }
        
        // Informace o faktuře
        sb.AppendLine("    <div class=\"info\">");
        sb.AppendLine("        <div class=\"info-section\">");
        sb.AppendLine("            <h3>Dodavatel</h3>");
        sb.AppendLine("            <p>[Zde by byly údaje dodavatele]</p>");
        sb.AppendLine("        </div>");
        sb.AppendLine("        <div class=\"info-section\">");
        sb.AppendLine("            <h3>Odběratel</h3>");
        sb.AppendLine($"            <p><strong>{invoice.CustomerName}</strong></p>");
        sb.AppendLine($"            <p>{invoice.CustomerAddress}</p>");
        if (!string.IsNullOrEmpty(invoice.CustomerCompanyId))
        {
            sb.AppendLine($"            <p>IČO: {invoice.CustomerCompanyId}</p>");
        }
        if (!string.IsNullOrEmpty(invoice.CustomerVatId))
        {
            sb.AppendLine($"            <p>DIČ: {invoice.CustomerVatId}</p>");
        }
        sb.AppendLine("        </div>");
        sb.AppendLine("    </div>");
        
        // Detaily faktury
        sb.AppendLine("    <table>");
        sb.AppendLine("        <tr>");
        sb.AppendLine("            <td><strong>Číslo faktury:</strong></td>");
        sb.AppendLine($"            <td>{invoice.InvoiceNumber}</td>");
        sb.AppendLine("            <td><strong>Variabilní symbol:</strong></td>");
        sb.AppendLine($"            <td>{invoice.VariableSymbol}</td>");
        sb.AppendLine("        </tr>");
        sb.AppendLine("        <tr>");
        sb.AppendLine("            <td><strong>Datum vystavení:</strong></td>");
        sb.AppendLine($"            <td>{invoice.IssueDate:dd.MM.yyyy}</td>");
        sb.AppendLine("            <td><strong>Datum splatnosti:</strong></td>");
        sb.AppendLine($"            <td>{invoice.DueDate:dd.MM.yyyy}</td>");
        sb.AppendLine("        </tr>");
        sb.AppendLine("        <tr>");
        sb.AppendLine("            <td><strong>Stav:</strong></td>");
        sb.AppendLine($"            <td colspan=\"3\">{GetStatusText(invoice.Status)}</td>");
        sb.AppendLine("        </tr>");
        sb.AppendLine("    </table>");
        
        // Položky faktury
        sb.AppendLine("    <h3>Položky faktury</h3>");
        sb.AppendLine("    <table>");
        sb.AppendLine("        <tr>");
        sb.AppendLine("            <th>Popis</th>");
        sb.AppendLine("            <th>Množství</th>");
        sb.AppendLine("            <th>Jednotka</th>");
        sb.AppendLine("            <th>Cena bez DPH</th>");
        sb.AppendLine("            <th>DPH %</th>");
        sb.AppendLine("            <th>Celkem bez DPH</th>");
        sb.AppendLine("            <th>DPH</th>");
        sb.AppendLine("            <th>Celkem s DPH</th>");
        sb.AppendLine("        </tr>");
        
        foreach (var item in invoice.Items)
        {
            sb.AppendLine("        <tr>");
            sb.AppendLine($"            <td>{item.Description}</td>");
            sb.AppendLine($"            <td>{item.Quantity}</td>");
            sb.AppendLine($"            <td>{item.Unit}</td>");
            sb.AppendLine($"            <td>{item.UnitPrice:N2} {invoice.Currency}</td>");
            sb.AppendLine($"            <td>{item.VatRate}%</td>");
            sb.AppendLine($"            <td>{item.TotalWithoutVat:N2} {invoice.Currency}</td>");
            sb.AppendLine($"            <td>{item.VatAmount:N2} {invoice.Currency}</td>");
            sb.AppendLine($"            <td>{item.TotalWithVat:N2} {invoice.Currency}</td>");
            sb.AppendLine("        </tr>");
        }
        
        sb.AppendLine("    </table>");
        
        // Celková částka
        sb.AppendLine("    <div class=\"total\">");
        sb.AppendLine($"        <p>Celkem bez DPH: {invoice.AmountWithoutVat:N2} {invoice.Currency}</p>");
        sb.AppendLine($"        <p>DPH: {invoice.VatAmount:N2} {invoice.Currency}</p>");
        sb.AppendLine($"        <p>Celkem k úhradě: {invoice.TotalAmount:N2} {invoice.Currency}</p>");
        sb.AppendLine("    </div>");
        
        // Poznámka
        if (!string.IsNullOrEmpty(invoice.Note))
        {
            sb.AppendLine("    <div style=\"margin-top: 30px;\">");
            sb.AppendLine("        <h3>Poznámka</h3>");
            sb.AppendLine($"        <p>{invoice.Note}</p>");
            sb.AppendLine("    </div>");
        }
        
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }
    
    private string GetStatusText(InvoiceStatus status)
    {
        return status switch
        {
            InvoiceStatus.Draft => "Koncept",
            InvoiceStatus.Issued => "Vystavená",
            InvoiceStatus.Paid => "Zaplacená",
            InvoiceStatus.Cancelled => "Stornovaná",
            InvoiceStatus.Overdue => "Po splatnosti",
            _ => status.ToString()
        };
    }
}
