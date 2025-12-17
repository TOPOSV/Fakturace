using Fakturace.Core.Models;

namespace Fakturace.Core.Services;

/// <summary>
/// Rozhraní pro generování PDF faktur
/// </summary>
public interface IPdfService
{
    /// <summary>
    /// Vygeneruje PDF faktury
    /// </summary>
    /// <param name="invoice">Faktura</param>
    /// <returns>PDF jako byte array</returns>
    Task<byte[]> GeneratePdfAsync(Invoice invoice);
    
    /// <summary>
    /// Uloží PDF faktury do souboru
    /// </summary>
    /// <param name="invoice">Faktura</param>
    /// <param name="filePath">Cesta k souboru</param>
    Task SavePdfToFileAsync(Invoice invoice, string filePath);
}
