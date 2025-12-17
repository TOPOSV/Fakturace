import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { setupPDFFont } from '../fonts/fontLoader';
import QRCode from 'qrcode';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

interface InvoiceData {
  number: string;
  type: string;
  issue_date: string;
  due_date: string;
  tax_date: string;
  client_name: string;
  client_address?: string;
  client_city?: string;
  client_zip?: string;
  client_ico?: string;
  client_dic?: string;
  client_is_vat_payer?: boolean;
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
  notes?: string;
  items: InvoiceItem[];
  variable_symbol?: string;
  constant_symbol?: string;
  payment_method?: string;
}

interface UserData {
  company_name?: string;
  address?: string;
  city?: string;
  zip?: string;
  ico?: string;
  dic?: string;
  email?: string;
  phone?: string;
  website?: string;
  bank_account?: string;
  iban?: string;
  swift?: string;
  logo?: string;
  stamp?: string;
}

export const generateInvoicePDF = async (invoice: InvoiceData, userData: UserData) => {
  // A4 format with 20mm margins - enable UTF-8 support
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const margin = 20; // 20mm margins
  const pageWidth = 210; // A4 width in mm
  const contentWidth = pageWidth - (2 * margin);
  
  // Load custom font for Czech diacritics support
  // Falls back to Helvetica if custom font is not available
  const fontName = await setupPDFFont(doc);
  
  // Safe font setter that handles missing font styles
  const safeSetFont = (style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal') => {
    try {
      doc.setFont(fontName, style);
    } catch (error) {
      // If the style doesn't exist, fall back to normal or helvetica
      console.warn(`Font style "${style}" not available for "${fontName}", using fallback`);
      try {
        doc.setFont(fontName, 'normal');
      } catch {
        doc.setFont('helvetica', style);
      }
    }
  };
  
  // Format number with thousands separator (space) for Czech format
  // Example: 1234567.89 => "1 234 567,89"
  const formatCzechNumber = (num: number): string => {
    const [intPart, decPart] = num.toFixed(2).split('.');
    // Add space as thousands separator
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formattedInt},${decPart}`;
  };
  
  // Color palette for professional look - Dark Red & Light Red theme
  const colors: {
    primary: [number, number, number];
    primaryLight: [number, number, number];
    accent: [number, number, number];
    dark: [number, number, number];
    lightGray: [number, number, number];
    mediumGray: [number, number, number];
    success: [number, number, number];
    text: [number, number, number];
  } = {
    primary: [180, 50, 50],        // Lighter Red #B43232 (was #8B0000)
    primaryLight: [220, 53, 69],   // Light Red #DC3545
    accent: [255, 152, 0],         // Vibrant Orange #FF9800 (kept)
    dark: [38, 50, 56],            // Dark Blue-Gray #263238
    lightGray: [250, 250, 250],    // Very Light Gray #FAFAFA
    mediumGray: [176, 190, 197],   // Blue-Gray #B0BEC5
    success: [67, 160, 71],        // Professional Green #43A047
    text: [55, 71, 79]             // Dark Blue-Gray #37474F
  };
  
  // Set the loaded font (Roboto or Helvetica fallback) - must specify style!
  safeSetFont('normal');
  
  // Check if client is VAT payer (default to true if not specified)
  const isVatPayer = invoice.client_is_vat_payer !== undefined ? invoice.client_is_vat_payer : true;
  
  // ============================================
  // CALCULATE TOTALS FROM ITEMS (for accurate display throughout PDF)
  // ============================================
  let calculatedSubtotal = 0;
  let calculatedVat = 0;
  let calculatedTotal = 0;
  
  invoice.items.forEach(item => {
    const qty = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const vatRate = isVatPayer ? (item.vat_rate || 21) : 0; // No VAT if not VAT payer
    const subtotal = unitPrice * qty;
    const vatAmount = subtotal * (vatRate / 100);
    
    calculatedSubtotal += subtotal;
    calculatedVat += vatAmount;
    calculatedTotal += subtotal + vatAmount;
  });
  
  // Use calculated values from items if we have items, otherwise fall back to invoice values
  // Note: We check for items.length > 0 instead of calculatedSubtotal > 0 to handle negative items correctly
  const finalSubtotal = invoice.items.length > 0 ? calculatedSubtotal : (invoice.subtotal || 0);
  const finalVat = invoice.items.length > 0 && isVatPayer ? calculatedVat : (isVatPayer ? (invoice.vat || 0) : 0);
  const finalTotal = invoice.items.length > 0 ? calculatedTotal : (invoice.total || 0);
  
  // ============================================
  // HLAVNÍ NADPIS - Faktura - daňový doklad s barevným pozadím
  // ============================================
  
  // Colored header banner
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Main title in white - NOW WITH CZECH DIACRITICS
  doc.setFontSize(20);
  safeSetFont('bold');
  doc.setTextColor(255, 255, 255);
  
  // Czech text with proper diacritics
  const typeText = invoice.type === 'invoice' ? 'Vydaná faktura - daňový doklad' : 
                   invoice.type === 'received' ? 'Přijatá faktura - daňový doklad' : 
                   invoice.type === 'advance' ? 'Zálohová faktura - NENÍ daňový doklad' : 'Faktura';
  doc.text(typeText, margin, 15);
  
  // Reset text color to dark
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  // Invoice number in colored box
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(pageWidth - margin - 55, margin, 55, 12, 'F');
  doc.setFontSize(12);
  safeSetFont('bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Číslo: ${invoice.number}`, pageWidth - margin - 52, margin + 8);
  
  // Reset text color
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  // ============================================
  // DVA BLOKY VEDLE SEBE - Dodavatel a Odberatel s barevnymi boxy
  // ============================================
  let yPos = margin + 25; // Moved 5mm lower (was +20, now +25)
  const col1X = margin;
  const col2X = margin + (contentWidth / 2) + 5; // Moved 5mm left (was +10, now +5)
  const boxWidth = (contentWidth / 2) - 5;
  
  // Track where supplier box will start
  const supplierBoxStartY = yPos + 5; // Box starts 5mm below this position for padding
  
  // ADD LOGO above supplier section if provided - positioned with proper aspect ratio
  if (userData.logo) {
    try {
      // Logo dimensions: Maintain aspect ratio, width limited to 50mm max, height auto-calculated
      const maxLogoWidth = 50; // Increased from 40 to 50mm
      const maxLogoHeight = 20; // Increased from 15 to 20mm
      
      // Load image properly to get dimensions
      const imgElement = new Image();
      imgElement.src = userData.logo;
      
      // Wait for image to load to get real dimensions
      await new Promise((resolve) => {
        imgElement.onload = resolve;
        // Fallback if already loaded
        if (imgElement.complete) resolve(null);
      });
      
      const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
      
      // Calculate dimensions maintaining aspect ratio
      let logoWidth = maxLogoWidth;
      let logoHeight = logoWidth / aspectRatio;
      
      // If height exceeds max, scale down by height instead
      if (logoHeight > maxLogoHeight) {
        logoHeight = maxLogoHeight;
        logoWidth = logoHeight * aspectRatio;
      }
      
      // Position logo 10mm ABOVE supplier box
      const logoY = supplierBoxStartY - logoHeight - 10;
      doc.addImage(userData.logo, 'PNG', col1X, logoY, logoWidth, logoHeight);
      
      // IMPORTANT: Re-set font after addImage() as jsPDF resets it to default
      safeSetFont('normal');
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }
  
  // Move yPos to where supplier box content starts (inside padding)
  yPos = supplierBoxStartY;
  
  // DODAVATEL (levy sloupec) - Light blue box
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(col1X, yPos - 5, boxWidth, 55, 2, 2, 'F');
  
  doc.setFontSize(11);
  safeSetFont('bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Dodavatel:', col1X + 3, yPos);
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  safeSetFont('normal');
  doc.setFontSize(9);
  yPos += 6;
  
  if (userData.company_name) {
    safeSetFont('bold');
    doc.text(userData.company_name, col1X + 3, yPos);
    safeSetFont('normal');
    yPos += 4;
  }
  if (userData.address) {
    doc.text(userData.address, col1X + 3, yPos);
    yPos += 4;
  }
  if (userData.zip && userData.city) {
    doc.text(`${userData.zip} ${userData.city}`, col1X + 3, yPos);
    yPos += 4;
  }
  doc.text('Česká republika', col1X + 3, yPos);
  yPos += 5;
  
  if (userData.ico) {
    doc.text(`IČ: ${userData.ico}`, col1X + 3, yPos);
    yPos += 4;
  }
  if (userData.dic) {
    doc.text(`DIČ: ${userData.dic}`, col1X + 3, yPos);
    yPos += 4;
  }
  if (userData.email) {
    doc.setTextColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.text(`E-mail: ${userData.email}`, col1X + 3, yPos);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    yPos += 4;
  }
  if (userData.phone) {
    doc.text(`Telefon: ${userData.phone}`, col1X + 3, yPos);
    yPos += 4;
  }
  if (userData.website) {
    doc.setTextColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.text(`Web: ${userData.website}`, col1X + 3, yPos);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  }
  
  const supplierEndY = yPos;
  
  // ODBERATEL (pravy sloupec) - Light teal box - starts at same Y as supplier box
  yPos = supplierBoxStartY; // Start at exactly same position as supplier
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(col2X, supplierBoxStartY - 5, boxWidth, 55, 2, 2, 'F');
  
  safeSetFont('bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.text('Odběratel:', col2X + 3, yPos);
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  safeSetFont('normal');
  doc.setFontSize(9);
  yPos += 6;
  
  if (invoice.client_name) {
    safeSetFont('bold');
    doc.text(invoice.client_name, col2X + 3, yPos);
    safeSetFont('normal');
    yPos += 4;
  }
  if (invoice.client_address) {
    doc.text(invoice.client_address, col2X + 3, yPos);
    yPos += 4;
  }
  if (invoice.client_zip && invoice.client_city) {
    doc.text(`${invoice.client_zip} ${invoice.client_city}`, col2X + 3, yPos);
    yPos += 4;
  }
  doc.text('Česká republika', col2X + 3, yPos);
  yPos += 5;
  
  if (invoice.client_ico) {
    doc.text(`IČ: ${invoice.client_ico}`, col2X + 3, yPos);
    yPos += 4;
  }
  if (invoice.client_dic) {
    doc.text(`DIČ: ${invoice.client_dic}`, col2X + 3, yPos);
  }
  
  // ============================================
  // TRI DATUMY V JEDNE RADCE s barevnym pozadim - BELOW supplier section
  // ============================================
  yPos = Math.max(supplierEndY, yPos) + 12; // Position below both supplier and client boxes
  
  // Date boxes with light background
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(margin, yPos, 55, 12, 1, 1, 'F');
  doc.roundedRect(margin + 58, yPos, 55, 12, 1, 1, 'F');
  doc.roundedRect(margin + 116, yPos, 55, 12, 1, 1, 'F');
  
  doc.setFontSize(8);
  safeSetFont('bold');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  doc.text('Datum vystavení:', margin + 2, yPos + 4);
  doc.text('Datum zdanitelného plnění:', margin + 60, yPos + 4);
  doc.text('Datum splatnosti:', margin + 118, yPos + 4);
  
  safeSetFont('normal');
  doc.setFontSize(9);
  doc.text(new Date(invoice.issue_date).toLocaleDateString('cs-CZ'), margin + 2, yPos + 9);
  doc.text(new Date(invoice.tax_date || invoice.issue_date).toLocaleDateString('cs-CZ'), margin + 60, yPos + 9);
  doc.text(new Date(invoice.due_date).toLocaleDateString('cs-CZ'), margin + 118, yPos + 9);
  
  // ============================================
  // BANKOVNI UDAJE v barevnem boxu - BELOW dates
  // ============================================
  yPos += 18; // Position below dates
  
  // Banking info box with light background
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'F');
  
  doc.setFontSize(10);
  safeSetFont('bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Bankovní údaje:', margin + 3, yPos + 5);
  
  safeSetFont('normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  yPos += 10;
  
  let bankYPos = yPos;
  if (userData.bank_account) {
    doc.text(`Číslo účtu: ${userData.bank_account}`, margin + 3, bankYPos);
    bankYPos += 4;
  }
  if (userData.iban) {
    doc.text(`IBAN: ${userData.iban}`, margin + 3, bankYPos);
    bankYPos += 4;
  }
  if (userData.swift) {
    doc.text(`SWIFT: ${userData.swift}`, margin + 3, bankYPos);
  }
  
  // Right side
  let rightYPos = yPos;
  // Add variable symbol with invoice number
  doc.text(`Variabilní symbol: ${invoice.number}`, margin + 95, rightYPos);
  rightYPos += 4;
  
  if (invoice.constant_symbol) {
    doc.text(`Konstantní symbol: ${invoice.constant_symbol}`, margin + 95, rightYPos);
    rightYPos += 4;
  }
  const paymentMethod = invoice.payment_method || 'Převodem';
  doc.text(`Způsob platby: ${paymentMethod}`, margin + 95, rightYPos);
  
  yPos = Math.max(bankYPos, rightYPos) + 5;
  
  // ============================================
  // TABULKA POLOZEK (jspdf-autotable) s lepsimi barvami
  // Removed "K úhradě" banner - items table moves up directly
  // ============================================
  yPos += 5; // Small spacing after banking info
  
  const tableData = invoice.items.map(item => {
    const qty = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const vatRate = isVatPayer ? (item.vat_rate || 21) : 0;
    const subtotal = unitPrice * qty;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    
    if (isVatPayer) {
      return [
        item.description || '',
        qty.toString(),
        formatCzechNumber(unitPrice), // Czech format with space separator
        `${vatRate} %`,
        formatCzechNumber(subtotal), // Czech format with space separator
        formatCzechNumber(vatAmount), // Czech format with space separator
        formatCzechNumber(total) // Czech format with space separator
      ];
    } else {
      // No VAT columns for non-VAT payers
      return [
        item.description || '',
        qty.toString(),
        formatCzechNumber(unitPrice), // Czech format with space separator
        formatCzechNumber(total) // Czech format with space separator (total = subtotal when no VAT)
      ];
    }
  });
  
  const tableHeaders = isVatPayer 
    ? [['Označení dodávky', 'Počet', 'Cena/j.', 'DPH %', 'Bez DPH', 'DPH', 'Celkem']]
    : [['Označení dodávky', 'Počet', 'Cena/j.', 'Celkem']];
  
  const columnStyles: any = isVatPayer ? {
    0: { cellWidth: 50, halign: 'left' as const },     // Description
    1: { cellWidth: 18, halign: 'center' as const },   // Quantity
    2: { cellWidth: 25, halign: 'right' as const, minCellWidth: 25 },    // Unit price
    3: { cellWidth: 15, halign: 'center' as const },   // VAT rate
    4: { cellWidth: 25, halign: 'right' as const, minCellWidth: 25 },    // Subtotal
    5: { cellWidth: 20, halign: 'right' as const, minCellWidth: 20 },    // VAT
    6: { cellWidth: 27, halign: 'right' as const, fontStyle: 'bold', minCellWidth: 27 }  // Total
  } : {
    0: { cellWidth: 90, halign: 'left' as const },     // Description (wider when no VAT columns)
    1: { cellWidth: 20, halign: 'center' as const },   // Quantity
    2: { cellWidth: 35, halign: 'right' as const, minCellWidth: 35 },    // Unit price
    3: { cellWidth: 35, halign: 'right' as const, fontStyle: 'bold', minCellWidth: 35 }  // Total
  };
  
  autoTable(doc, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 9,
      cellPadding: 3,
      lineColor: colors.mediumGray,
      lineWidth: 0.1,
      textColor: colors.text
    },
    headStyles: {
      fillColor: colors.primaryLight,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9
    },
    // @ts-ignore - columnStyles with numeric keys is compatible with jspdf-autotable
    columnStyles: columnStyles,
    alternateRowStyles: {
      fillColor: colors.lightGray
    },
    margin: { left: margin, right: margin }
  });
  
  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 5;
  
  // ============================================
  // TEXT POD TABULKOU (drobne pismo) - s ceskymi znaky
  // ============================================
  doc.setFontSize(8);
  safeSetFont('italic');
  doc.setTextColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
  const disclaimerText = 'Zboží zůstává až do úplného uhrazení majetkem dodavatele. Při zpožděné úhradě vám budeme účtovat penále 0,05 % za každý započatý den prodlení.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(disclaimerLines, margin, yPos);
  yPos += disclaimerLines.length * 3 + 5;
  
  safeSetFont('normal');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  // ============================================
  // SOUHRNNA TABULKA DPH s barvami - Using precalculated values
  // Only show if client is VAT payer
  // ============================================
  if (isVatPayer) {
    const subtotalAmount = `${formatCzechNumber(finalSubtotal)} Kč`;
    const vatAmount = `${formatCzechNumber(finalVat)} Kč`;
    const totalAmountFormatted = `${formatCzechNumber(finalTotal)} Kč`;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Základ', 'Výše DPH', 'Celkem']],
      body: [[subtotalAmount, vatAmount, totalAmountFormatted]],
      theme: 'grid',
      styles: {
        font: fontName,
        fontSize: 10,
        cellPadding: 3,
        lineColor: colors.mediumGray,
        lineWidth: 0.1,
        halign: 'right',
        textColor: colors.text,
        minCellWidth: 40, // Increased from 30 to 40 to prevent "Kč" wrapping
        cellWidth: 'wrap',
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: colors.accent,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontStyle: 'bold',
        fontSize: 11,
        minCellHeight: 8
      },
      columnStyles: {
        0: { minCellWidth: 40, cellWidth: 'auto' }, // Základ
        1: { minCellWidth: 40, cellWidth: 'auto' }, // Výše DPH
        2: { minCellWidth: 40, cellWidth: 'auto' }  // Celkem
      },
      // Align table to match items table end position
      margin: { left: pageWidth - margin - 130, right: margin }
    });
    
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY;
  }
  
  // ============================================
  // CELKEM K UHRADE - Below VAT table (or items table if no VAT) - RIGHT ALIGNED
  // ============================================
  const totalBoxY = yPos + 5; // Position below VAT table or items table
  const totalBoxWidth = 80; // Width of the box
  const totalBoxX = pageWidth - margin - totalBoxWidth; // Right-aligned
  const totalAmountFormatted = `${formatCzechNumber(finalTotal)} Kč`;
  
  // Final total box - RIGHT ALIGNED
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(totalBoxX, totalBoxY, totalBoxWidth, 10, 2, 2, 'F');
  
  doc.setFontSize(12);
  safeSetFont('bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Celkem k úhradě: ${totalAmountFormatted}`, totalBoxX + 3, totalBoxY + 7);
  
  // ============================================
  // RAZITKO A PODPIS s rameckem - Below total box, RIGHT ALIGNED
  // ============================================
  // Position stamp section below total box (5mm spacing)
  const stampYPos = totalBoxY + 15; // 10mm box height + 5mm spacing
  
  doc.setFontSize(10);
  safeSetFont('bold');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  // Right-aligned text above stamp box
  doc.text('Razítko a podpis:', totalBoxX, stampYPos);
  
  // Signature box - RIGHT ALIGNED: positioned on right side
  doc.setDrawColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(totalBoxX, stampYPos + 2, 65, 30); // 65x30mm box, right-aligned
  
  // ADD STAMP inside the signature box if provided - LARGER dimensions with proper aspect ratio
  if (userData.stamp) {
    try {
      // Stamp dimensions: INCREASED - Maintain aspect ratio, max 45x25mm
      const maxStampWidth = 45;
      const maxStampHeight = 25;
      
      // Load image properly to get dimensions
      const stampImgElement = new Image();
      stampImgElement.src = userData.stamp;
      
      // Wait for image to load to get real dimensions
      await new Promise((resolve) => {
        stampImgElement.onload = resolve;
        // Fallback if already loaded
        if (stampImgElement.complete) resolve(null);
      });
      
      const stampAspectRatio = stampImgElement.naturalWidth / stampImgElement.naturalHeight;
      
      // Calculate dimensions maintaining aspect ratio
      let stampWidth = maxStampWidth;
      let stampHeight = stampWidth / stampAspectRatio;
      
      // If height exceeds max, scale down by height instead
      if (stampHeight > maxStampHeight) {
        stampHeight = maxStampHeight;
        stampWidth = stampHeight * stampAspectRatio;
      }
      
      const stampX = totalBoxX + 5; // Right-aligned with total box + padding
      // Position stamp 3mm from top of box
      const stampY = stampYPos + 5;
      doc.addImage(userData.stamp, 'PNG', stampX, stampY, stampWidth, stampHeight);
      
      // IMPORTANT: Re-set font after addImage() as jsPDF resets it to default
      safeSetFont('normal');
    } catch (error) {
      console.warn('Failed to add stamp to PDF:', error);
    }
  }
  
  // ============================================
  // QR KOD PLATBY - Left side, at same height as stamp
  // ============================================
  try {
    // Generate QR Payment Code according to Czech SPAYD standard
    // Format: SPD*1.0*ACC:CZ1234567890*AM:12345.67*CC:CZK*MSG:Platba za VF20240001
    // SPAYD format uses single line with asterisk separators (not newlines)
    let qrData = 'SPD*1.0';
    
    // Add account if available - IBAN format ONLY
    // Czech SPAYD standard format: ACC:IBAN (must be IBAN format)
    // IBAN: CZ12345678901234567890 (country code + numbers only, no spaces, no hyphens)
    // Example: ACC:CZ6508000000192000145399
    if (userData.iban) {
      const account = userData.iban.trim().toUpperCase();
      
      // Check if it's IBAN format (starts with 2 uppercase letters followed by numbers)
      if (/^[A-Z]{2}/.test(account)) {
        // It's IBAN - remove all spaces and hyphens
        const accountNumber = account.replace(/[\s-]/g, '');
        
        // Validate it's proper IBAN format (2 letters + numbers only)
        if (/^[A-Z]{2}[0-9]+$/.test(accountNumber)) {
          qrData += `*ACC:${accountNumber}`;
        }
      }
    }
    
    // Add amount (required)
    qrData += `*AM:${finalTotal.toFixed(2)}`;
    
    // Add currency (required)
    qrData += '*CC:CZK';
    
    // Add message (invoice number)
    qrData += `*MSG:Platba za ${invoice.number}`;
    
    // Log QR data for debugging
    console.log('QR Code Data:', qrData);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Add QR code on LEFT side, at same height as stamp (side-by-side layout)
    const qrSize = 35; // 35mm QR code
    const qrX = margin; // LEFT-aligned at margin
    const qrY = stampYPos + 2; // Same height as stamp box
    
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    
    // IMPORTANT: Re-set font after addImage() as jsPDF resets it to default
    // This ensures Czech diacritics continue to work properly
    safeSetFont('normal');
    
    // Add small text below QR code
    doc.setFontSize(7);
    safeSetFont('normal');
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text('Naskenujte pro platbu', qrX + (qrSize / 2), qrY + qrSize + 4, { align: 'center' });
  } catch (error) {
    console.warn('Failed to generate QR code:', error);
  }
  
  // ============================================
  // DOLNI CAST - ZAKONCENI
  // ============================================
  const bottomY = 270; // Pozice v dolni casti stranky
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(8);
  safeSetFont('normal');
  const currentDate = new Date().toLocaleDateString('cs-CZ');
  const userName = userData.company_name || 'Systém';
  doc.text(`Vytiskl(a): ${userName}, ${currentDate}`, margin, bottomY + 8);
  
  doc.setTextColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  safeSetFont('italic');
  doc.text('Vystaveno v online fakturační službě Fakturace', margin, bottomY + 12);
  
  // Ulozeni PDF
  doc.save(`Faktura-${invoice.number}.pdf`);
};
