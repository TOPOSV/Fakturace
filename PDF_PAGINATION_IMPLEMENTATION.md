# PDF Pagination Implementation

## Overview
This document describes the implementation of automatic pagination for PDF invoice generation when there are many items that don't fit on a single page.

## Problem Statement
Previously, when an invoice had many items, the PDF would overflow beyond the page boundaries, causing content (VAT summary, total box, QR code, stamp) to be cut off or not visible.

## Solution
Implemented automatic page boundary detection and page breaks in the PDF generator (`client/src/utils/pdfGenerator.ts`):

### Key Changes

1. **Page Boundary Helper Function**
   - Added `checkAndAddPage()` function that checks if content fits on current page
   - Automatically adds a new page when content would overflow
   - Returns the appropriate Y position for content placement

2. **Strategic Page Break Points**
   - Before disclaimer text
   - Before VAT summary table
   - Before total box and stamp section
   - Each check ensures at least 15-55mm of space depending on content

3. **Page Numbers**
   - Added automatic page numbering for multi-page PDFs
   - Shows "Strana X z Y" (Page X of Y) at the bottom right of each page
   - Only appears when there are 2+ pages

4. **Dynamic Footer Positioning**
   - Footer now positions dynamically based on content
   - Ensures proper spacing from last content element

## Technical Details

### Page Dimensions
- A4 format: 210mm × 297mm
- Top margin: 20mm
- Bottom margin: 20mm
- Content area: 170mm × 257mm

### Content Height Estimates
- Disclaimer text: ~10mm
- VAT summary table: ~15mm
- Total box: ~10mm
- Stamp section: ~30mm
- Footer: ~20mm

## Testing

### Manual Testing Steps

1. **Create an invoice with many items** (15+ items recommended)
   - Log into the application
   - Navigate to Faktury (Invoices)
   - Click "Nová faktura" (New Invoice)
   - Add 15-20 items to ensure content exceeds one page

2. **Generate PDF**
   - Save the invoice
   - Click the PDF export button (📄)
   - Open the generated PDF

3. **Verify Pagination**
   - Check that all items are visible across pages
   - Verify VAT summary table appears correctly
   - Verify total box is visible
   - Verify QR code and stamp appear on appropriate page
   - Check page numbers appear at bottom right (if 2+ pages)
   - Verify footer appears on last page

### Expected Behavior

**Single Page Invoice:**
- All content fits on one page
- No page numbers shown
- Footer at bottom of page

**Multi-Page Invoice:**
- Items table automatically paginated by jspdf-autotable
- Content after table starts on new page if needed
- Page numbers shown on all pages
- Footer on last page with proper spacing

## Code Example

```typescript
// Check if we need a new page before adding content
const checkAndAddPage = (requiredSpace: number): number => {
  if (yPos + requiredSpace > maxY) {
    doc.addPage();
    return margin + 10; // Return to top margin on new page
  }
  return yPos;
};

// Usage before adding content
yPos = checkAndAddPage(15); // Check if 15mm is available
// ... add content here
```

## Benefits

1. **No Content Loss**: All invoice information is visible regardless of item count
2. **Professional Appearance**: Clean page breaks maintain document structure
3. **Easy Navigation**: Page numbers help users navigate multi-page invoices
4. **Automatic**: Works without user intervention or configuration

## Compatibility

- Works with all invoice types (issued, received, advance)
- Works with both VAT and non-VAT invoices
- Compatible with existing logo, stamp, and QR code features

## Future Enhancements

Potential improvements for future versions:
- Add page headers with invoice number on continuation pages
- Optimize page breaks to avoid splitting item groups
- Add "continued on next page" indicators
- Configurable page break thresholds
