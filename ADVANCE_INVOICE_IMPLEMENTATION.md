# Zálohová Faktura (Advance Payment Invoice) - Implementation Summary

## Overview
This implementation adds support for "Zálohová faktura" (advance payment invoices) to the Fakturace application, providing a complete workflow for managing advance payments.

## Features Implemented

### 1. Database Schema Changes
- **New invoice type**: Added 'advance' to the CHECK constraint for invoice types
- **New fields**:
  - `linked_invoice_id`: Links advance invoice to the regular invoice created from it
  - `auto_create_regular_invoice`: Boolean flag (0/1) to automatically create regular invoice when advance is paid

### 2. Backend Implementation

#### Migration (`007_add_advance_invoice_type.ts`)
- Creates new invoices table with 'advance' type support
- Adds `linked_invoice_id` and `auto_create_regular_invoice` fields
- Preserves all existing data during migration

#### Controller Updates (`invoiceController.ts`)
- **createInvoice**: Now accepts `auto_create_regular_invoice` parameter
- **updateInvoice**: Automatically creates regular invoice when advance invoice is marked as paid (if auto_create is enabled)
- **createRegularFromAdvance**: New endpoint to manually create regular invoice from advance invoice
- Helper function `createRegularInvoiceFromAdvance`: Handles the logic of creating a regular invoice from an advance invoice

#### Route Addition (`routes/invoices.ts`)
- New POST endpoint: `/api/invoices/:id/create-regular` for manual regular invoice creation

### 3. Frontend Implementation

#### Type Definitions (`types/index.ts`)
- Updated `Invoice` interface to include:
  - `'advance'` as a valid invoice type
  - `linked_invoice_id` field
  - `auto_create_regular_invoice` field

#### Invoice Form (`InvoiceForm.tsx`)
- Added "Zálohová faktura" option to the type dropdown
- Added checkbox for auto-creating regular invoice (shown only for advance invoices)
- Includes helpful text explaining the auto-create feature

#### Invoice List (`InvoiceList.tsx`)
- Added "ZÁLOHOVÉ FAKTURY" filter button
- Shows special indicator when advance invoice has linked regular invoice
- Added green "📝" button to manually create regular invoice from paid advance invoices
- Filter logic updated to handle advance invoice type

#### PDF Generator (`pdfGenerator.ts`)
- Advance invoices are marked as "Zálohová faktura - NENÍ daňový doklad"
- Regular invoices remain marked as "Vydaná faktura - daňový doklad"

## Usage Workflow

### Creating Advance Invoice
1. User selects "Zálohová faktura" from type dropdown
2. Optionally checks "Automaticky vytvořit běžnou fakturu po zaplacení"
3. Fills in client, items, and other details
4. Saves the invoice

### Automatic Regular Invoice Creation
When auto-create is enabled:
1. User marks advance invoice as "paid"
2. System automatically:
   - Creates new regular invoice with same items and amounts
   - Links the regular invoice to the advance invoice
   - Adds note: "Běžná faktura vytvořená ze zálohové faktury č. {number}"

### Manual Regular Invoice Creation
1. User finds paid advance invoice in the list
2. Clicks the green "📝" button
3. System creates regular invoice and links it

## Technical Details

### Separate Numbering Sequence
- Advance invoices have their own numbering sequence (counted by type)
- Example: `202500001` for first advance invoice of 2025
- Regular invoices continue their own sequence

### Database Relationships
```
invoices (advance)
    ↓ (linked_invoice_id)
invoices (regular)
```

### Status Workflow
- Advance invoice: unpaid → paid
- When paid and auto_create enabled → Regular invoice created with status unpaid
- Advance invoices can be cancelled (status: 'cancelled') instead of deleted

## Testing

The implementation has been tested with:
- Database schema migration successfully applied
- Advance invoice type correctly stored in database
- Fields `linked_invoice_id` and `auto_create_regular_invoice` working correctly

## Future Enhancements

Potential improvements for future versions:
1. Email notification when regular invoice is auto-created
2. Bank integration to automatically mark as paid
3. Cancellation workflow with reason tracking
4. History view showing relationship between advance and regular invoices
5. Report showing all advance invoices and their fulfillment status
