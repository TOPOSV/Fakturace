namespace Fakturace.Core.Models;

/// <summary>
/// Položka na faktuře
/// </summary>
public class InvoiceItem
{
    /// <summary>
    /// Unikátní identifikátor položky
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID faktury
    /// </summary>
    public Guid InvoiceId { get; set; }
    
    /// <summary>
    /// Název položky
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Množství
    /// </summary>
    public decimal Quantity { get; set; }
    
    /// <summary>
    /// Jednotka (ks, hod, m2, atd.)
    /// </summary>
    public string Unit { get; set; } = "ks";
    
    /// <summary>
    /// Jednotková cena bez DPH
    /// </summary>
    public decimal UnitPrice { get; set; }
    
    /// <summary>
    /// Sazba DPH (např. 21 pro 21%)
    /// </summary>
    public decimal VatRate { get; set; }
    
    /// <summary>
    /// Celková cena bez DPH (Quantity * UnitPrice)
    /// </summary>
    public decimal TotalWithoutVat { get; set; }
    
    /// <summary>
    /// DPH částka
    /// </summary>
    public decimal VatAmount { get; set; }
    
    /// <summary>
    /// Celková cena včetně DPH
    /// </summary>
    public decimal TotalWithVat { get; set; }
}
