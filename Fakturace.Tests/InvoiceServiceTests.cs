using Fakturace.Core.Models;
using Fakturace.Core.Services;
using Xunit;

namespace Fakturace.Tests;

public class InvoiceServiceTests
{
    private readonly IInvoiceService _invoiceService;
    
    public InvoiceServiceTests()
    {
        _invoiceService = new InvoiceService();
    }
    
    [Fact]
    public async Task CreateInvoice_ShouldGenerateId()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        
        // Act
        var result = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Assert
        Assert.NotEqual(Guid.Empty, result.Id);
    }
    
    [Fact]
    public async Task CreateInvoice_ShouldGenerateInvoiceNumber()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        invoice.InvoiceNumber = string.Empty;
        
        // Act
        var result = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Assert
        Assert.NotEmpty(result.InvoiceNumber);
        Assert.StartsWith("F", result.InvoiceNumber);
    }
    
    [Fact]
    public async Task CreateAdvanceInvoice_ShouldHaveDifferentNumberingPrefix()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Advance);
        invoice.InvoiceNumber = string.Empty;
        
        // Act
        var result = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Assert
        Assert.NotEmpty(result.InvoiceNumber);
        Assert.StartsWith("ZF", result.InvoiceNumber);
    }
    
    [Fact]
    public async Task CreateInvoice_ShouldCalculateTotals()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        
        // Act
        var result = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Assert
        Assert.Equal(1000m, result.AmountWithoutVat);
        Assert.Equal(210m, result.VatAmount);
        Assert.Equal(1210m, result.TotalAmount);
    }
    
    [Fact]
    public async Task GetInvoice_ShouldReturnExistingInvoice()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        var created = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Act
        var result = await _invoiceService.GetInvoiceAsync(created.Id);
        
        // Assert
        Assert.NotNull(result);
        Assert.Equal(created.Id, result.Id);
    }
    
    [Fact]
    public async Task GetInvoice_ShouldReturnNullForNonExisting()
    {
        // Act
        var result = await _invoiceService.GetInvoiceAsync(Guid.NewGuid());
        
        // Assert
        Assert.Null(result);
    }
    
    [Fact]
    public async Task MarkAsPaid_ShouldUpdateStatus()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        var created = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Act
        var result = await _invoiceService.MarkAsPaidAsync(created.Id);
        
        // Assert
        Assert.Equal(InvoiceStatus.Paid, result.Status);
    }
    
    [Fact]
    public async Task MarkAsPaid_AdvanceInvoiceWithAutoCreate_ShouldCreateRegularInvoice()
    {
        // Arrange
        var advanceInvoice = CreateTestInvoice(InvoiceType.Advance);
        advanceInvoice.AutoCreateRegularInvoiceOnPayment = true;
        var created = await _invoiceService.CreateInvoiceAsync(advanceInvoice);
        
        // Act
        var result = await _invoiceService.MarkAsPaidAsync(created.Id);
        
        // Assert
        Assert.Equal(InvoiceStatus.Paid, result.Status);
        Assert.NotNull(result.RegularInvoiceId);
        
        // Ověřit, že běžná faktura byla vytvořena
        var regularInvoice = await _invoiceService.GetInvoiceAsync(result.RegularInvoiceId.Value);
        Assert.NotNull(regularInvoice);
        Assert.Equal(InvoiceType.Regular, regularInvoice.Type);
        Assert.Equal(created.Id, regularInvoice.AdvanceInvoiceId);
    }
    
    [Fact]
    public async Task MarkAsPaid_CancelledInvoice_ShouldThrowException()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        var created = await _invoiceService.CreateInvoiceAsync(invoice);
        await _invoiceService.CancelInvoiceAsync(created.Id);
        
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _invoiceService.MarkAsPaidAsync(created.Id));
    }
    
    [Fact]
    public async Task CancelInvoice_ShouldUpdateStatus()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        var created = await _invoiceService.CreateInvoiceAsync(invoice);
        
        // Act
        var result = await _invoiceService.CancelInvoiceAsync(created.Id);
        
        // Assert
        Assert.Equal(InvoiceStatus.Cancelled, result.Status);
    }
    
    [Fact]
    public async Task CancelInvoice_PaidInvoice_ShouldThrowException()
    {
        // Arrange
        var invoice = CreateTestInvoice(InvoiceType.Regular);
        var created = await _invoiceService.CreateInvoiceAsync(invoice);
        await _invoiceService.MarkAsPaidAsync(created.Id);
        
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _invoiceService.CancelInvoiceAsync(created.Id));
    }
    
    [Fact]
    public async Task CreateRegularFromAdvance_ShouldCreateLinkedInvoice()
    {
        // Arrange
        var advanceInvoice = CreateTestInvoice(InvoiceType.Advance);
        var created = await _invoiceService.CreateInvoiceAsync(advanceInvoice);
        
        // Act
        var regularInvoice = await _invoiceService.CreateRegularFromAdvanceAsync(created.Id);
        
        // Assert
        Assert.NotNull(regularInvoice);
        Assert.Equal(InvoiceType.Regular, regularInvoice.Type);
        Assert.Equal(created.Id, regularInvoice.AdvanceInvoiceId);
        Assert.Equal(created.TotalAmount, regularInvoice.TotalAmount);
        Assert.Contains(created.InvoiceNumber, regularInvoice.Note);
    }
    
    [Fact]
    public async Task CreateRegularFromAdvance_NonAdvanceInvoice_ShouldThrowException()
    {
        // Arrange
        var regularInvoice = CreateTestInvoice(InvoiceType.Regular);
        var created = await _invoiceService.CreateInvoiceAsync(regularInvoice);
        
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _invoiceService.CreateRegularFromAdvanceAsync(created.Id));
    }
    
    [Fact]
    public async Task CreateRegularFromAdvance_AlreadyCreated_ShouldThrowException()
    {
        // Arrange
        var advanceInvoice = CreateTestInvoice(InvoiceType.Advance);
        var created = await _invoiceService.CreateInvoiceAsync(advanceInvoice);
        await _invoiceService.CreateRegularFromAdvanceAsync(created.Id);
        
        // Update the advance invoice to have the RegularInvoiceId set
        var updated = await _invoiceService.GetInvoiceAsync(created.Id);
        updated!.RegularInvoiceId = Guid.NewGuid();
        await _invoiceService.UpdateInvoiceAsync(updated);
        
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _invoiceService.CreateRegularFromAdvanceAsync(created.Id));
    }
    
    [Fact]
    public async Task GenerateInvoiceNumber_ShouldUseCorrectFormat()
    {
        // Act
        var regularNumber = await _invoiceService.GenerateInvoiceNumberAsync(InvoiceType.Regular, 2025);
        var advanceNumber = await _invoiceService.GenerateInvoiceNumberAsync(InvoiceType.Advance, 2025);
        
        // Assert
        Assert.Matches(@"^F2025-\d{6}$", regularNumber);
        Assert.Matches(@"^ZF2025-\d{6}$", advanceNumber);
    }
    
    [Fact]
    public async Task GenerateInvoiceNumber_ShouldIncrementSequentially()
    {
        // Arrange
        var invoice1 = CreateTestInvoice(InvoiceType.Regular);
        invoice1.InvoiceNumber = string.Empty;
        var invoice2 = CreateTestInvoice(InvoiceType.Regular);
        invoice2.InvoiceNumber = string.Empty;
        
        // Act
        var result1 = await _invoiceService.CreateInvoiceAsync(invoice1);
        var result2 = await _invoiceService.CreateInvoiceAsync(invoice2);
        
        // Assert
        Assert.NotEqual(result1.InvoiceNumber, result2.InvoiceNumber);
        
        // Extract numbers
        var num1 = int.Parse(result1.InvoiceNumber.Split('-')[1]);
        var num2 = int.Parse(result2.InvoiceNumber.Split('-')[1]);
        Assert.Equal(num1 + 1, num2);
    }
    
    [Fact]
    public async Task AdvanceAndRegularInvoices_ShouldHaveSeparateNumberingSeries()
    {
        // Arrange
        var advanceInvoice = CreateTestInvoice(InvoiceType.Advance);
        advanceInvoice.InvoiceNumber = string.Empty;
        var regularInvoice = CreateTestInvoice(InvoiceType.Regular);
        regularInvoice.InvoiceNumber = string.Empty;
        
        // Act
        var advance = await _invoiceService.CreateInvoiceAsync(advanceInvoice);
        var regular = await _invoiceService.CreateInvoiceAsync(regularInvoice);
        
        // Assert
        Assert.StartsWith("ZF", advance.InvoiceNumber);
        Assert.StartsWith("F", regular.InvoiceNumber);
        Assert.DoesNotMatch(@"^ZF", regular.InvoiceNumber);
    }
    
    private Invoice CreateTestInvoice(InvoiceType type)
    {
        return new Invoice
        {
            Type = type,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(14),
            Status = InvoiceStatus.Issued,
            CustomerId = "CUST001",
            CustomerName = "Test Customer",
            CustomerAddress = "Test Address 123",
            CustomerCompanyId = "12345678",
            CustomerVatId = "CZ12345678",
            Currency = "CZK",
            Items = new List<InvoiceItem>
            {
                new InvoiceItem
                {
                    Description = "Test Item",
                    Quantity = 10,
                    Unit = "ks",
                    UnitPrice = 100m,
                    VatRate = 21m
                }
            }
        };
    }
}
