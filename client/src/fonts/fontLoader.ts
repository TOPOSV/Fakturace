// Font loader for PDF generation with Czech diacritics support
// This module handles loading custom fonts for jsPDF

import { jsPDF } from 'jspdf';

// Import custom font (this will be added after font conversion)
// Uncomment the line below once you've added the font file:
// import { robotoNormalFont } from './roboto-normal';

export interface CustomFont {
  fontName: string;
  fontStyle: string;
  fontData: string;
}

/**
 * Load custom font into jsPDF instance
 * @param doc - jsPDF document instance
 * @param font - Custom font data
 */
export const loadCustomFont = (doc: jsPDF, font: CustomFont): void => {
  try {
    // Add the font to jsPDF
    doc.addFileToVFS(`${font.fontName}.ttf`, font.fontData);
    doc.addFont(`${font.fontName}.ttf`, font.fontName, font.fontStyle);
    
    console.log(`✓ Custom font "${font.fontName}" loaded successfully`);
  } catch (error) {
    console.error(`✗ Failed to load custom font "${font.fontName}":`, error);
    throw error;
  }
};

/**
 * Check if custom font is available
 * @returns true if Roboto font module exists
 */
export const isCustomFontAvailable = (): boolean => {
  try {
    // Try to import the font module
    // This will fail if the font file doesn't exist
    require('./roboto-normal');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get Roboto font configuration
 * @returns Custom font configuration for Roboto
 */
export const getRobotoFont = async (): Promise<CustomFont | null> => {
  try {
    // Dynamically import the font module
    const { robotoNormalFont } = await import('./roboto-normal');
    
    return {
      fontName: 'Roboto',
      fontStyle: 'normal',
      fontData: robotoNormalFont
    };
  } catch (error) {
    console.warn('Roboto font not found. Using fallback font. See src/fonts/README.md for setup instructions.');
    return null;
  }
};

/**
 * Setup PDF document with best available font for Czech characters
 * @param doc - jsPDF document instance
 * @returns Font name to use in the document
 */
export const setupPDFFont = async (doc: jsPDF): Promise<string> => {
  try {
    // Try to load custom Roboto font
    const robotoFont = await getRobotoFont();
    
    if (robotoFont) {
      loadCustomFont(doc, robotoFont);
      return 'Roboto';
    }
  } catch (error) {
    console.warn('Custom font loading failed, using fallback font');
  }
  
  // Fallback to Helvetica
  console.info('Using Helvetica font (Czech diacritics may not display correctly)');
  return 'helvetica';
};

export default {
  loadCustomFont,
  isCustomFontAvailable,
  getRobotoFont,
  setupPDFFont
};
