using Fakturace.Core.Models;

namespace Fakturace.Core.Services;

/// <summary>
/// Rozhraní pro správu faktur
/// </summary>
public interface IInvoiceService
{
    /// <summary>
    /// Vytvoří novou fakturu
    /// </summary>
    Task<Invoice> CreateInvoiceAsync(Invoice invoice);
    
    /// <summary>
    /// Získá fakturu podle ID
    /// </summary>
    Task<Invoice?> GetInvoiceAsync(Guid id);
    
    /// <summary>
    /// Získá všechny faktury
    /// </summary>
    Task<IEnumerable<Invoice>> GetAllInvoicesAsync();
    
    /// <summary>
    /// Aktualizuje fakturu
    /// </summary>
    Task<Invoice> UpdateInvoiceAsync(Invoice invoice);
    
    /// <summary>
    /// Označí fakturu jako zaplacenou
    /// </summary>
    Task<Invoice> MarkAsPaidAsync(Guid invoiceId);
    
    /// <summary>
    /// Stornuje fakturu
    /// </summary>
    Task<Invoice> CancelInvoiceAsync(Guid invoiceId);
    
    /// <summary>
    /// Vytvoří běžnou fakturu ze zálohové faktury
    /// </summary>
    Task<Invoice> CreateRegularFromAdvanceAsync(Guid advanceInvoiceId);
    
    /// <summary>
    /// Vygeneruje číslo faktury podle typu a roku
    /// </summary>
    Task<string> GenerateInvoiceNumberAsync(InvoiceType type, int year);
}
