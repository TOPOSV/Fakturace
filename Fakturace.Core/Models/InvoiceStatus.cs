namespace Fakturace.Core.Models;

/// <summary>
/// Stav faktury
/// </summary>
public enum InvoiceStatus
{
    /// <summary>
    /// Koncept - faktura ještě není vystavena
    /// </summary>
    Draft = 0,
    
    /// <summary>
    /// Vystavená - čeká na platbu
    /// </summary>
    Issued = 1,
    
    /// <summary>
    /// Zaplacená
    /// </summary>
    Paid = 2,
    
    /// <summary>
    /// Stornovaná
    /// </summary>
    Cancelled = 3,
    
    /// <summary>
    /// Po splatnosti
    /// </summary>
    Overdue = 4
}
