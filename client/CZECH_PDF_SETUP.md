# Czech Diacritics Support for PDF Export

This implementation adds full support for Czech diacritics (háčky, čárky) in PDF invoices.

## Status
✅ **Code Ready** - PDF generator now uses proper Czech characters with diacritics  
⚠️ **Font Required** - You need to add the Roboto font file to complete the setup

## Quick Setup Guide

### Step 1: Download Roboto Font
Go to [Google Fonts - Roboto](https://fonts.google.com/specimen/Roboto) and click "Download family"

### Step 2: Convert Font to Base64
1. Extract `Roboto-Regular.ttf` from the downloaded ZIP file
2. Go to the [jsPDF Font Converter](https://raw.githack.com/MrRio/jsPDF/master/fontconverter/fontconverter.html)
3. Upload `Roboto-Regular.ttf`
4. Click "Create"
5. Copy the generated base64 string (it will be very long, ~200-400KB)

### Step 3: Update Font File
1. Open `client/src/fonts/roboto-normal.ts`
2. Replace `'FONT_DATA_HERE'` with the base64 string you copied
3. Save the file

Example:
```typescript
export const robotoNormalFont = 'AAEAAAASAQAABAAgRFNJRwAAAAEAAB6QAAAACEVPUAAAAR...'; // Very long string
```

### Step 4: Test
1. Restart the development server: `npm start`
2. Create or view an invoice
3. Click the PDF export button (📄)
4. Check that Czech characters display correctly:
   - ř, ž, š, č, ě, á, í, é, ú, ů, ý, ň, ď, ť

## What Works Now

### Czech Text in PDF ✅
- **"Faktura - daňový doklad"** (invoice title)
- **"Označení dodávky"** (product description)
- **"Číslo"** (number)
- **"Číslo účtu"** (account number)
- **"K úhradě"** (to pay)
- **"Česká republika"** (Czech Republic)
- **"Razítko a podpis"** (stamp and signature)
- **"Kč"** (CZK currency symbol)
- **And all other Czech texts with proper diacritics**

### Automatic Fallback
If the Roboto font is not added:
- PDF generation still works
- Falls back to Helvetica font
- Czech diacritics may not display correctly
- Console warning will appear

## Alternative Fonts

If you prefer a different font, you can use:
- **DejaVu Sans** - https://dejavu-fonts.github.io/
- **Open Sans** - https://fonts.google.com/specimen/Open+Sans
- **Lato** - https://fonts.google.com/specimen/Lato

Just convert the font and update the `roboto-normal.ts` file (you can rename it too).

## File Size Impact
- Font file: ~200-400KB (base64 encoded)
- PDF file increase: ~150-300KB per document
- This is acceptable for proper Czech character support

## Troubleshooting

### Console shows "Using Helvetica font"
**Solution**: The Roboto font file hasn't been added yet. Follow Step 3 above.

### Font converter doesn't work
**Solution**: Try using a different browser (Chrome recommended) or use an alternative converter:
- https://www.base64encode.org/ (encode the TTF file directly)
- Then wrap it in: `data:font/ttf;base64,YOUR_BASE64_HERE`

### PDF still shows ASCII characters
**Solution**:
1. Check that `robotoNormalFont` in `roboto-normal.ts` contains actual font data (not 'FONT_DATA_HERE')
2. Restart the development server
3. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
4. Try exporting the PDF again

### Build/compile errors
**Solution**:
1. Make sure the font string is wrapped in quotes: `export const robotoNormalFont = 'YOUR_FONT_DATA';`
2. The string should be one long line with no line breaks
3. Run `npm install` to ensure all dependencies are installed

## Technical Details

### How It Works
1. `fontLoader.ts` - Attempts to load Roboto font from `roboto-normal.ts`
2. If found, adds font to jsPDF using `addFileToVFS` and `addFont`
3. If not found, falls back to Helvetica
4. Returns font name to use throughout PDF generation
5. All Czech texts use proper Unicode diacritics

### Font Loading Process
```
setupPDFFont(doc) →
  getRobotoFont() →
    import roboto-normal.ts →
      if success: loadCustomFont() →
        doc.addFileToVFS() →
          doc.addFont() →
            return 'Roboto'
      if fail: return 'helvetica'
```

## Benefits of This Implementation
✅ Proper Czech diacritics in all PDF text  
✅ Professional appearance  
✅ Automatic fallback if font not available  
✅ No breaking changes - PDF generation still works  
✅ Easy to add/update font  
✅ Console logging for debugging  
✅ Type-safe implementation  

## Next Steps
1. Add the Roboto font following the guide above
2. Test PDF export with Czech characters
3. Enjoy professional invoices with proper Czech text! 🎉
