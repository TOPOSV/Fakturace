namespace Fakturace.Core.Models;

/// <summary>
/// Typ faktury
/// </summary>
public enum InvoiceType
{
    /// <summary>
    /// Běžná faktura (daňový doklad)
    /// </summary>
    Regular = 0,
    
    /// <summary>
    /// Zálohová faktura (není daňový doklad)
    /// </summary>
    Advance = 1
}
