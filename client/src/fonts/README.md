# Font Setup for Czech PDF Support

This directory contains fonts for generating PDFs with Czech diacritics (háčky, čárky).

## Quick Setup (Recommended)

### Option 1: Use Pre-Converted Font
1. Download the pre-converted Roboto font from: https://github.com/spipu/html2pdf/blob/master/src/Resources/fonts/roboto.php
2. Save as `roboto-normal.ts` in this directory
3. Restart the development server

### Option 2: Convert Font Yourself
1. Download Roboto-Regular.ttf from: https://fonts.google.com/specimen/Roboto (click "Download family")
2. Go to: https://raw.githack.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
3. Upload the TTF file
4. Copy the generated JavaScript code
5. Save as `roboto-normal.ts` in this directory with this structure:

```typescript
export const robotoNormalFont = `
// Paste the base64 font data here
`;
```

## Alternative: Use DejaVu Sans
If Roboto doesn't work, you can use DejaVu Sans:
1. Download from: https://dejavu-fonts.github.io/
2. Convert using the same tool above
3. Save as `dejavu-normal.ts`

## File Size
The font file will be approximately 200-400KB. This is acceptable for proper Czech character support.

## Testing
After adding the font, test with these Czech characters:
- ř, ž, š, č, ě, á, í, é, ú, ů, ý, ň, ď, ť
- Example words: "daňový", "Označení", "Číslo", "K úhradě", "Česká"
