import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { setupPDFFont } from '../fonts/fontLoader';

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
    primary: [139, 0, 0],          // Dark Red #8B0000
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
  
  // ============================================
  // CALCULATE TOTALS FROM ITEMS (for accurate display throughout PDF)
  // ============================================
  let calculatedSubtotal = 0;
  let calculatedVat = 0;
  let calculatedTotal = 0;
  
  invoice.items.forEach(item => {
    const qty = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const vatRate = item.vat_rate || 21;
    const subtotal = unitPrice * qty;
    const vatAmount = subtotal * (vatRate / 100);
    
    calculatedSubtotal += subtotal;
    calculatedVat += vatAmount;
    calculatedTotal += subtotal + vatAmount;
  });
  
  // Use calculated values if available, otherwise fall back to invoice values
  const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (invoice.subtotal || 0);
  const finalVat = calculatedVat > 0 ? calculatedVat : (invoice.vat || 0);
  const finalTotal = calculatedTotal > 0 ? calculatedTotal : (invoice.total || 0);
  
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
                   invoice.type === 'received' ? 'Přijatá faktura - daňový doklad' : 'Faktura';
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
  let yPos = margin + 20; // Moved 20mm up (was 40)
  const col1X = margin;
  const col2X = margin + (contentWidth / 2) + 10;
  const boxWidth = (contentWidth / 2) - 5;
  
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
      
      // Position logo above supplier box (25mm above yPos instead of 35mm)
      const logoY = yPos - 25; // Moved 10mm down (was -35, now -25)
      doc.addImage(userData.logo, 'PNG', col1X, logoY, logoWidth, logoHeight);
      // Add space after logo so supplier box doesn't overlap
      yPos += 5;
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }
  
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
  
  // ODBERATEL (pravy sloupec) - Light teal box
  yPos = margin + 25; // Adjusted to match supplier (was +45, now +25 to move 20mm up)
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(col2X, yPos - 5, boxWidth, 55, 2, 2, 'F');
  
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
  // TRI DATUMY V JEDNE RADCE s barevnym pozadim
  // ============================================
  yPos = Math.max(supplierEndY, yPos) + 12 - 20; // Moved 20mm up by subtracting 20
  
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
  // BANKOVNI UDAJE v barevnem boxu
  // ============================================
  yPos += 18 - 20; // Moved 20mm up by subtracting 20 (net: -2mm from previous position)
  
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
  if (invoice.variable_symbol) {
    doc.text(`Variabilní symbol: ${invoice.variable_symbol}`, margin + 95, rightYPos);
    rightYPos += 4;
  }
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
    const vatRate = item.vat_rate || 21;
    const subtotal = unitPrice * qty;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    
    return [
      item.description || '',
      qty.toString(),
      unitPrice.toFixed(2).replace('.', ',') + ' Kč',
      vatRate.toString() + ' %',
      subtotal.toFixed(2).replace('.', ',') + ' Kč',
      vatAmount.toFixed(2).replace('.', ',') + ' Kč',
      total.toFixed(2).replace('.', ',') + ' Kč'
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Označení dodávky', 'Počet', 'Cena/j.', 'DPH %', 'Bez DPH', 'DPH', 'Celkem']],
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
    columnStyles: {
      0: { cellWidth: 50, halign: 'left' },     // Description: reduced from 60 to 50
      1: { cellWidth: 18, halign: 'center' },   // Quantity: reduced from 20 to 18
      2: { cellWidth: 22, halign: 'right' },    // Unit price: reduced from 25 to 22
      3: { cellWidth: 15, halign: 'center' },   // VAT rate: kept at 15
      4: { cellWidth: 22, halign: 'right' },    // Subtotal: reduced from 25 to 22
      5: { cellWidth: 18, halign: 'right' },    // VAT: reduced from 20 to 18
      6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }  // Total: kept at 25
    },
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
  // ============================================
  const subtotalAmount = finalSubtotal.toFixed(2).replace('.', ',') + ' Kč';
  const vatAmount = finalVat.toFixed(2).replace('.', ',') + ' Kč';
  const totalAmountFormatted = finalTotal.toFixed(2).replace('.', ',') + ' Kč';
  
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
      textColor: colors.text
    },
    headStyles: {
      fillColor: colors.accent,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontStyle: 'bold',
      fontSize: 11
    },
    margin: { left: margin + 100, right: margin }
  });
  
  // @ts-ignore
  const vatTableEndY = doc.lastAutoTable.finalY;
  
  // ============================================
  // RAZITKO A PODPIS s rameckem - ALIGNED WITH VAT TABLE
  // ============================================
  // Position stamp section lower (20mm down from VAT table alignment - moved 5mm more down)
  const stampYPos = vatTableEndY - 20; // Moved 5mm down (was -25, now -20)
  
  doc.setFontSize(10);
  safeSetFont('bold');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  // Move text to the left (was pageWidth - margin - 85)
  doc.text('Razítko a podpis:', margin, stampYPos);
  
  // Signature box - SMALLER: positioned on left side, moved down
  doc.setDrawColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, stampYPos + 2, 65, 30); // Reduced from 80x35 to 65x30
  
  // ADD STAMP inside the signature box if provided - LARGER dimensions with proper aspect ratio
  if (userData.stamp) {
    try {
      // Stamp dimensions: INCREASED - Maintain aspect ratio, max 45x25mm (was 35x30)
      const maxStampWidth = 45; // Increased from 35 to 45mm
      const maxStampHeight = 25; // Reduced from 30 to 25mm (box is shorter now)
      
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
      
      const stampX = margin + 5;
      // Position stamp 3mm from top of box (was 5mm)
      const stampY = stampYPos + 3;
      doc.addImage(userData.stamp, 'PNG', stampX, stampY, stampWidth, stampHeight);
    } catch (error) {
      console.warn('Failed to add stamp to PDF:', error);
    }
  }
  
  yPos = vatTableEndY + 10;
  
  // ============================================
  // DOLNI CAST - ZAKONCENI s barevnym boxem
  // ============================================
  const bottomY = 270; // Pozice v dolni casti stranky
  
  // Final total box
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, bottomY - 5, contentWidth, 10, 2, 2, 'F');
  
  doc.setFontSize(14);
  safeSetFont('bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Celkem k úhradě: ${totalAmountFormatted}`, margin + 3, bottomY + 2);
  
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
