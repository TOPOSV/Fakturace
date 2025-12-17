namespace Fakturace.Core.Models;

/// <summary>
/// Entita faktury
/// </summary>
public class Invoice
{
    /// <summary>
    /// Unikátní identifikátor faktury
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Typ faktury (běžná/zálohová)
    /// </summary>
    public InvoiceType Type { get; set; }
    
    /// <summary>
    /// Číslo faktury (např. 2025001)
    /// </summary>
    public string InvoiceNumber { get; set; } = string.Empty;
    
    /// <summary>
    /// Variabilní symbol
    /// </summary>
    public string VariableSymbol { get; set; } = string.Empty;
    
    /// <summary>
    /// Datum vystavení
    /// </summary>
    public DateTime IssueDate { get; set; }
    
    /// <summary>
    /// Datum splatnosti
    /// </summary>
    public DateTime DueDate { get; set; }
    
    /// <summary>
    /// Stav faktury
    /// </summary>
    public InvoiceStatus Status { get; set; }
    
    /// <summary>
    /// Celková částka bez DPH
    /// </summary>
    public decimal AmountWithoutVat { get; set; }
    
    /// <summary>
    /// DPH
    /// </summary>
    public decimal VatAmount { get; set; }
    
    /// <summary>
    /// Celková částka včetně DPH
    /// </summary>
    public decimal TotalAmount { get; set; }
    
    /// <summary>
    /// Měna (CZK, EUR, atd.)
    /// </summary>
    public string Currency { get; set; } = "CZK";
    
    /// <summary>
    /// ID zákazníka
    /// </summary>
    public string CustomerId { get; set; } = string.Empty;
    
    /// <summary>
    /// Jméno zákazníka
    /// </summary>
    public string CustomerName { get; set; } = string.Empty;
    
    /// <summary>
    /// Adresa zákazníka
    /// </summary>
    public string CustomerAddress { get; set; } = string.Empty;
    
    /// <summary>
    /// IČO zákazníka
    /// </summary>
    public string CustomerCompanyId { get; set; } = string.Empty;
    
    /// <summary>
    /// DIČ zákazníka
    /// </summary>
    public string CustomerVatId { get; set; } = string.Empty;
    
    /// <summary>
    /// Položky faktury
    /// </summary>
    public List<InvoiceItem> Items { get; set; } = new();
    
    /// <summary>
    /// Poznámka
    /// </summary>
    public string? Note { get; set; }
    
    /// <summary>
    /// ID zálohové faktury (pro běžnou fakturu vytvořenou ze zálohové)
    /// </summary>
    public Guid? AdvanceInvoiceId { get; set; }
    
    /// <summary>
    /// ID běžné faktury (pro zálohou fakturu která byla převedena na běžnou)
    /// </summary>
    public Guid? RegularInvoiceId { get; set; }
    
    /// <summary>
    /// Automaticky vytvořit běžnou fakturu po zaplacení (platné pouze pro zálohové faktury)
    /// </summary>
    public bool AutoCreateRegularInvoiceOnPayment { get; set; }
    
    /// <summary>
    /// Datum vytvoření záznamu
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Datum poslední změny
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
