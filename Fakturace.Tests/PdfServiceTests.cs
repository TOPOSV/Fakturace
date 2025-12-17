using Fakturace.Core.Models;
using Fakturace.Core.Services;
using Xunit;

namespace Fakturace.Tests;

public class PdfServiceTests
{
    private readonly IPdfService _pdfService;
    
    public PdfServiceTests()
    {
        _pdfService = new SimplePdfService();
    }
    
    [Fact]
    public async Task GeneratePdf_RegularInvoice_ShouldContainInvoiceNumber()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        invoice.InvoiceNumber = "F2025-000001";
        
        // Act
        var pdfBytes = await _pdfService.GeneratePdfAsync(invoice);
        var pdfContent = System.Text.Encoding.UTF8.GetString(pdfBytes);
        
        // Assert
        Assert.Contains("F2025-000001", pdfContent);
    }
    
    [Fact]
    public async Task GeneratePdf_AdvanceInvoice_ShouldContainWarning()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Advance);
        
        // Act
        var pdfBytes = await _pdfService.GeneratePdfAsync(invoice);
        var pdfContent = System.Text.Encoding.UTF8.GetString(pdfBytes);
        
        // Assert
        Assert.Contains("ZÁLOHOVÁ FAKTURA", pdfContent);
        Assert.Contains("NENÍ daňový doklad", pdfContent);
    }
    
    [Fact]
    public async Task GeneratePdf_RegularInvoice_ShouldNotContainAdvanceWarning()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        
        // Act
        var pdfBytes = await _pdfService.GeneratePdfAsync(invoice);
        var pdfContent = System.Text.Encoding.UTF8.GetString(pdfBytes);
        
        // Assert
        Assert.DoesNotContain("ZÁLOHOVÁ FAKTURA", pdfContent);
        Assert.DoesNotContain("NENÍ daňový doklad", pdfContent);
    }
    
    [Fact]
    public async Task GeneratePdf_RegularFromAdvance_ShouldContainReference()
    {
        // Arrange
        var advanceId = Guid.NewGuid();
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        invoice.AdvanceInvoiceId = advanceId;
        
        // Act
        var pdfBytes = await _pdfService.GeneratePdfAsync(invoice);
        var pdfContent = System.Text.Encoding.UTF8.GetString(pdfBytes);
        
        // Assert
        Assert.Contains("zálohové faktury", pdfContent);
        Assert.Contains(advanceId.ToString(), pdfContent);
    }
    
    [Fact]
    public async Task GeneratePdf_AdvanceWithRegular_ShouldContainReference()
    {
        // Arrange
        var regularId = Guid.NewGuid();
        var invoice = CreateTestInvoice(InvoiceType.Advance);
        invoice.RegularInvoiceId = regularId;
        
        // Act
        var pdfBytes = await _pdfService.GeneratePdfAsync(invoice);
        var pdfContent = System.Text.Encoding.UTF8.GetString(pdfBytes);
        
        // Assert
        Assert.Contains("běžná faktura", pdfContent);
        Assert.Contains(regularId.ToString(), pdfContent);
    }
    
    [Fact]
    public async Task GeneratePdf_ShouldIncludeCustomerDetails()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        
        // Act
        var pdfBytes = await _pdfService.GeneratePdfAsync(invoice);
        var pdfContent = System.Text.Encoding.UTF8.GetString(pdfBytes);
        
        // Assert
        Assert.Contains(invoice.CustomerName, pdfContent);
        Assert.Contains(invoice.CustomerAddress, pdfContent);
        Assert.Contains(invoice.CustomerCompanyId, pdfContent);
        Assert.Contains(invoice.CustomerVatId, pdfContent);
    }
    
    [Fact]
    public async Task GeneratePdf_ShouldIncludeInvoiceItems()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        
        // Act
        var pdfBytes = await _pdfService.GeneratePdfAsync(invoice);
        var pdfContent = System.Text.Encoding.UTF8.GetString(pdfBytes);
        
        // Assert
        Assert.Contains("Test Item", pdfContent);
        Assert.Contains("1,000.00", pdfContent); // Amount without VAT
        Assert.Contains("210.00", pdfContent); // VAT amount
        Assert.Contains("1,210.00", pdfContent); // Total amount
    }
    
    [Fact]
    public async Task SavePdfToFile_ShouldCreateFile()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        var tempFile = Path.Combine(Path.GetTempPath(), $"invoice_{Guid.NewGuid()}.html");
        
        try
        {
            // Act
            await _pdfService.SavePdfToFileAsync(invoice, tempFile);
            
            // Assert
            Assert.True(File.Exists(tempFile));
            var content = await File.ReadAllTextAsync(tempFile);
            Assert.Contains(invoice.CustomerName, content);
        }
        finally
        {
            // Cleanup
            if (File.Exists(tempFile))
            {
                File.Delete(tempFile);
            }
        }
    }
    
    private Invoice CreateTestInvoice(InvoiceType type)
    {
        return new Invoice
        {
            Id = Guid.NewGuid(),
            Type = type,
            InvoiceNumber = type == InvoiceType.Advance ? "ZF2025-000001" : "F2025-000001",
            VariableSymbol = "2025000001",
            IssueDate = new DateTime(2025, 1, 1),
            DueDate = new DateTime(2025, 1, 15),
            Status = InvoiceStatus.Issued,
            CustomerId = "CUST001",
            CustomerName = "Test Customer Ltd.",
            CustomerAddress = "Test Street 123, Prague",
            CustomerCompanyId = "12345678",
            CustomerVatId = "CZ12345678",
            Currency = "CZK",
            AmountWithoutVat = 1000m,
            VatAmount = 210m,
            TotalAmount = 1210m,
            Items = new List<InvoiceItem>
            {
                new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    Description = "Test Item",
                    Quantity = 10,
                    Unit = "ks",
                    UnitPrice = 100m,
                    VatRate = 21m,
                    TotalWithoutVat = 1000m,
                    VatAmount = 210m,
                    TotalWithVat = 1210m
                }
            }
        };
    }
}
