# Tax Document Feature - Implementation Summary

## What Was Requested
The user requested the ability to print a **tax document** (daňový doklad) for paid advance invoices, in compliance with Czech VAT law.

## What Was Implemented

### ✅ New Button for Paid Advance Invoices
When an advance invoice is marked as **PAID**, a new **blue button** �� appears in the Actions column:
- **Icon**: 🧾 (receipt emoji)
- **Color**: Blue (#007bff)
- **Tooltip**: "Tisk daňového dokladu k přijaté platbě"
- **Position**: In the Actions column, next to other action buttons

### ✅ PDF Generation
When the button is clicked:
1. Generates a PDF with the same content as the advance invoice
2. **Different header**: "Daňový doklad k přijaté platbě" (instead of "Zálohová faktura - NENÍ daňový doklad")
3. **Different filename**: "Danovy-doklad-{number}.pdf" (instead of "Faktura-{number}.pdf")

## Czech VAT Law Compliance

### Before Payment
- Advance invoice shows: **"Zálohová faktura - NENÍ daňový doklad"**
- This indicates it's NOT a tax document, only a payment request
- VAT is shown informatively

### After Payment
- User clicks 🧾 button to generate: **"Daňový doklad k přijaté platbě"**
- This IS a proper tax document for VAT purposes
- Must be issued within 15 days of receiving payment

## User Workflow

```
Step 1: Create Advance Invoice
   │
   ├─ Type: "Zálohová faktura"
   └─ PDF says: "NENÍ daňový doklad"

Step 2: Send to Client & Receive Payment
   │
   └─ Mark as "UHRAZENO" (Paid)

Step 3: Print Tax Document (NEW FEATURE)
   │
   ├─ Click blue 🧾 button
   ├─ PDF says: "Daňový doklad k přijaté platbě"
   └─ This is the official tax document
```

## Technical Implementation

### Files Modified
1. **client/src/utils/pdfGenerator.ts**
   - Added optional parameter: `isTaxDocument: boolean = false`
   - Changes header text when `isTaxDocument=true`
   - Changes filename when `isTaxDocument=true`

2. **client/src/components/Invoices/InvoiceList.tsx**
   - Added function: `handleExportTaxDocument()`
   - Added button: Conditional render for paid advance invoices
   - Button calls: `generateInvoicePDF(fullInvoice, userData, true)`

### Code Quality
- ✅ No TypeScript errors
- ✅ No security vulnerabilities (CodeQL)
- ✅ No code review issues
- ✅ Minimal changes (surgical approach)

## Benefits

1. **Legal Compliance**: Meets Czech VAT requirements
2. **User Friendly**: Simple one-click solution
3. **Clear Distinction**: Different headers prevent confusion
4. **Repeatable**: Can print tax document multiple times if needed
5. **Non-Invasive**: Doesn't affect existing functionality

## Notes

- The button appears for ALL paid advance invoices
- The tax document can be printed multiple times (e.g., if original is lost)
- This is separate from the "Create Regular Invoice" feature
- Both features can coexist - user can choose which approach to use
