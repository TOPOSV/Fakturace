using Fakturace.Core.Models;

namespace Fakturace.Core.Services;

/// <summary>
/// Služba pro správu faktur s podporou zálohových faktur
/// </summary>
public class InvoiceService : IInvoiceService
{
    // In-memory úložiště pro demo účely
    private readonly List<Invoice> _invoices = new();
    private readonly object _lock = new();
    
    /// <summary>
    /// Vytvoří novou fakturu
    /// </summary>
    public Task<Invoice> CreateInvoiceAsync(Invoice invoice)
    {
        lock (_lock)
        {
            if (invoice.Id == Guid.Empty)
            {
                invoice.Id = Guid.NewGuid();
            }
            
            invoice.CreatedAt = DateTime.UtcNow;
            invoice.UpdatedAt = DateTime.UtcNow;
            
            // Vygenerovat číslo faktury pokud není zadáno
            if (string.IsNullOrEmpty(invoice.InvoiceNumber))
            {
                var year = invoice.IssueDate.Year;
                invoice.InvoiceNumber = GenerateInvoiceNumberAsync(invoice.Type, year).Result;
            }
            
            // Vygenerovat variabilní symbol pokud není zadán
            if (string.IsNullOrEmpty(invoice.VariableSymbol))
            {
                invoice.VariableSymbol = invoice.InvoiceNumber;
            }
            
            // Vypočítat celkové částky z položek
            RecalculateInvoiceTotals(invoice);
            
            _invoices.Add(invoice);
            
            return Task.FromResult(invoice);
        }
    }
    
    /// <summary>
    /// Získá fakturu podle ID
    /// </summary>
    public Task<Invoice?> GetInvoiceAsync(Guid id)
    {
        lock (_lock)
        {
            var invoice = _invoices.FirstOrDefault(i => i.Id == id);
            return Task.FromResult(invoice);
        }
    }
    
    /// <summary>
    /// Získá všechny faktury
    /// </summary>
    public Task<IEnumerable<Invoice>> GetAllInvoicesAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Invoice>>(_invoices.ToList());
        }
    }
    
    /// <summary>
    /// Aktualizuje fakturu
    /// </summary>
    public Task<Invoice> UpdateInvoiceAsync(Invoice invoice)
    {
        lock (_lock)
        {
            var existingInvoice = _invoices.FirstOrDefault(i => i.Id == invoice.Id);
            if (existingInvoice == null)
            {
                throw new InvalidOperationException($"Faktura s ID {invoice.Id} nebyla nalezena.");
            }
            
            invoice.UpdatedAt = DateTime.UtcNow;
            
            // Vypočítat celkové částky z položek
            RecalculateInvoiceTotals(invoice);
            
            _invoices.Remove(existingInvoice);
            _invoices.Add(invoice);
            
            return Task.FromResult(invoice);
        }
    }
    
    /// <summary>
    /// Označí fakturu jako zaplacenou
    /// </summary>
    public async Task<Invoice> MarkAsPaidAsync(Guid invoiceId)
    {
        var invoice = await GetInvoiceAsync(invoiceId);
        if (invoice == null)
        {
            throw new InvalidOperationException($"Faktura s ID {invoiceId} nebyla nalezena.");
        }
        
        if (invoice.Status == InvoiceStatus.Cancelled)
        {
            throw new InvalidOperationException("Stornovanou fakturu nelze označit jako zaplacenou.");
        }
        
        invoice.Status = InvoiceStatus.Paid;
        invoice.UpdatedAt = DateTime.UtcNow;
        
        // Pokud je to zálohová faktura a má nastaveno automatické vytvoření běžné faktury
        if (invoice.Type == InvoiceType.Advance && 
            invoice.AutoCreateRegularInvoiceOnPayment && 
            invoice.RegularInvoiceId == null)
        {
            var regularInvoice = await CreateRegularFromAdvanceAsync(invoiceId);
            invoice.RegularInvoiceId = regularInvoice.Id;
        }
        
        return await UpdateInvoiceAsync(invoice);
    }
    
    /// <summary>
    /// Stornuje fakturu
    /// </summary>
    public async Task<Invoice> CancelInvoiceAsync(Guid invoiceId)
    {
        var invoice = await GetInvoiceAsync(invoiceId);
        if (invoice == null)
        {
            throw new InvalidOperationException($"Faktura s ID {invoiceId} nebyla nalezena.");
        }
        
        if (invoice.Status == InvoiceStatus.Paid)
        {
            throw new InvalidOperationException("Zaplacenou fakturu nelze stornovat.");
        }
        
        invoice.Status = InvoiceStatus.Cancelled;
        invoice.UpdatedAt = DateTime.UtcNow;
        
        return await UpdateInvoiceAsync(invoice);
    }
    
    /// <summary>
    /// Vytvoří běžnou fakturu ze zálohové faktury
    /// </summary>
    public async Task<Invoice> CreateRegularFromAdvanceAsync(Guid advanceInvoiceId)
    {
        var advanceInvoice = await GetInvoiceAsync(advanceInvoiceId);
        if (advanceInvoice == null)
        {
            throw new InvalidOperationException($"Zálohová faktura s ID {advanceInvoiceId} nebyla nalezena.");
        }
        
        if (advanceInvoice.Type != InvoiceType.Advance)
        {
            throw new InvalidOperationException("Faktura není zálohová faktura.");
        }
        
        if (advanceInvoice.RegularInvoiceId != null)
        {
            throw new InvalidOperationException("Běžná faktura již byla vytvořena.");
        }
        
        // Vytvoření běžné faktury s kopií dat ze zálohové
        var regularInvoice = new Invoice
        {
            Id = Guid.NewGuid(),
            Type = InvoiceType.Regular,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(14),
            Status = InvoiceStatus.Issued,
            CustomerId = advanceInvoice.CustomerId,
            CustomerName = advanceInvoice.CustomerName,
            CustomerAddress = advanceInvoice.CustomerAddress,
            CustomerCompanyId = advanceInvoice.CustomerCompanyId,
            CustomerVatId = advanceInvoice.CustomerVatId,
            Currency = advanceInvoice.Currency,
            AdvanceInvoiceId = advanceInvoiceId,
            Note = $"Faktura vytvořená na základě zálohové faktury č. {advanceInvoice.InvoiceNumber}",
            Items = advanceInvoice.Items.Select(item => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                Description = item.Description,
                Quantity = item.Quantity,
                Unit = item.Unit,
                UnitPrice = item.UnitPrice,
                VatRate = item.VatRate,
                TotalWithoutVat = item.TotalWithoutVat,
                VatAmount = item.VatAmount,
                TotalWithVat = item.TotalWithVat
            }).ToList()
        };
        
        return await CreateInvoiceAsync(regularInvoice);
    }
    
    /// <summary>
    /// Vygeneruje číslo faktury podle typu a roku
    /// </summary>
    public Task<string> GenerateInvoiceNumberAsync(InvoiceType type, int year)
    {
        lock (_lock)
        {
            // Prefix podle typu faktury
            var prefix = type == InvoiceType.Advance ? "ZF" : "F";
            
            // Najít poslední fakturu daného typu v daném roce
            var lastNumber = _invoices
                .Where(i => i.Type == type && i.IssueDate.Year == year)
                .Select(i => i.InvoiceNumber)
                .Where(n => n.StartsWith(prefix))
                .Select(n =>
                {
                    var parts = n.Split('-');
                    if (parts.Length == 2 && int.TryParse(parts[1], out var num))
                    {
                        return num;
                    }
                    return 0;
                })
                .DefaultIfEmpty(0)
                .Max();
            
            var nextNumber = lastNumber + 1;
            return Task.FromResult($"{prefix}{year}-{nextNumber:D6}");
        }
    }
    
    /// <summary>
    /// Přepočítá celkové částky faktury z položek
    /// </summary>
    private void RecalculateInvoiceTotals(Invoice invoice)
    {
        // Přepočítat každou položku
        foreach (var item in invoice.Items)
        {
            item.TotalWithoutVat = item.Quantity * item.UnitPrice;
            item.VatAmount = item.TotalWithoutVat * (item.VatRate / 100m);
            item.TotalWithVat = item.TotalWithoutVat + item.VatAmount;
            item.InvoiceId = invoice.Id;
            
            if (item.Id == Guid.Empty)
            {
                item.Id = Guid.NewGuid();
            }
        }
        
        // Přepočítat celkové částky faktury
        invoice.AmountWithoutVat = invoice.Items.Sum(i => i.TotalWithoutVat);
        invoice.VatAmount = invoice.Items.Sum(i => i.VatAmount);
        invoice.TotalAmount = invoice.Items.Sum(i => i.TotalWithVat);
    }
}
