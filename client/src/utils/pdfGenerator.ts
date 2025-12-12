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
  
  // Color palette for professional look
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
    primary: [41, 98, 255],      // Blue #2962FF
    primaryLight: [63, 81, 181],  // Indigo #3F51B5
    accent: [0, 150, 136],        // Teal #009688
    dark: [33, 33, 33],           // Dark Gray #212121
    lightGray: [245, 245, 245],   // Light Gray #F5F5F5
    mediumGray: [189, 189, 189],  // Medium Gray #BDBDBD
    success: [76, 175, 80],       // Green #4CAF50
    text: [66, 66, 66]            // Text Gray #424242
  };
  
  // Set the loaded font (Roboto or Helvetica fallback)
  doc.setFont(fontName);
  
  // ============================================
  // HLAVNÍ NADPIS - Faktura - daňový doklad s barevným pozadím
  // ============================================
  
  // Colored header banner
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Main title in white - NOW WITH CZECH DIACRITICS
  doc.setFontSize(20);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(255, 255, 255);
  
  // Czech text with proper diacritics
  const typeText = invoice.type === 'invoice' ? 'Faktura - daňový doklad' : 
                   invoice.type === 'proforma' ? 'Zálohová faktura' : 'Nabídka';
  doc.text(typeText, margin, 15);
  
  // Reset text color to dark
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  // Invoice number in colored box
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(pageWidth - margin - 55, margin, 55, 12, 'F');
  doc.setFontSize(12);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Číslo: ${invoice.number}`, pageWidth - margin - 52, margin + 8);
  
  // Reset text color
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  // ============================================
  // DVA BLOKY VEDLE SEBE - Dodavatel a Odberatel s barevnymi boxy
  // ============================================
  let yPos = margin + 45;
  const col1X = margin;
  const col2X = margin + (contentWidth / 2) + 10;
  const boxWidth = (contentWidth / 2) - 5;
  
  // DODAVATEL (levy sloupec) - Light blue box
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(col1X, yPos - 5, boxWidth, 55, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Dodavatel:', col1X + 3, yPos);
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  yPos += 6;
  
  if (userData.company_name) {
    doc.setFont(fontName, 'bold');
    doc.text(userData.company_name, col1X + 3, yPos);
    doc.setFont(fontName, 'normal');
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
  yPos = margin + 45;
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(col2X, yPos - 5, boxWidth, 55, 2, 2, 'F');
  
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.text('Odběratel:', col2X + 3, yPos);
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  yPos += 6;
  
  if (invoice.client_name) {
    doc.setFont(fontName, 'bold');
    doc.text(invoice.client_name, col2X + 3, yPos);
    doc.setFont(fontName, 'normal');
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
  yPos = Math.max(supplierEndY, yPos) + 12;
  
  // Date boxes with light background
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(margin, yPos, 55, 12, 1, 1, 'F');
  doc.roundedRect(margin + 58, yPos, 55, 12, 1, 1, 'F');
  doc.roundedRect(margin + 116, yPos, 55, 12, 1, 1, 'F');
  
  doc.setFontSize(8);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  doc.text('Datum vystavení:', margin + 2, yPos + 4);
  doc.text('Datum zdanitelného plnění:', margin + 60, yPos + 4);
  doc.text('Datum splatnosti:', margin + 118, yPos + 4);
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.text(new Date(invoice.issue_date).toLocaleDateString('cs-CZ'), margin + 2, yPos + 9);
  doc.text(new Date(invoice.tax_date || invoice.issue_date).toLocaleDateString('cs-CZ'), margin + 60, yPos + 9);
  doc.text(new Date(invoice.due_date).toLocaleDateString('cs-CZ'), margin + 118, yPos + 9);
  
  // ============================================
  // BANKOVNI UDAJE v barevnem boxu
  // ============================================
  yPos += 18;
  
  // Banking info box with light background
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Bankovní údaje:', margin + 3, yPos + 5);
  
  doc.setFont(fontName, 'normal');
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
  // VELKY ZVYRAZNENY TEXT - K UHRADE s barevnym boxem
  // ============================================
  yPos += 5;
  
  // Prominent total amount box
  doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  
  doc.setFontSize(16);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(255, 255, 255);
  const totalAmount = (invoice.total || 0).toFixed(2).replace('.', ',');
  const totalText = `K úhradě: ${totalAmount} ${invoice.currency || 'Kč'}`;
  doc.text(totalText, margin + 3, yPos + 8);
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  // ============================================
  // TABULKA POLOZEK (jspdf-autotable) s lepsimi barvami
  // ============================================
  yPos += 15;
  
  const tableData = invoice.items.map(item => {
    const qty = item.quantity || 0;
    const unitPrice = (item.unit_price || 0).toFixed(2).replace('.', ',');
    const vatRate = item.vat_rate || 21;
    const subtotal = (item.unit_price || 0) * qty;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    
    return [
      item.description || '',
      qty.toString(),
      unitPrice,
      vatRate.toString(),
      subtotal.toFixed(2).replace('.', ','),
      vatAmount.toFixed(2).replace('.', ','),
      total.toFixed(2).replace('.', ',')
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
  doc.setFont(fontName, 'italic');
  doc.setTextColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
  const disclaimerText = 'Zboží zůstává až do úplného uhrazení majetkem dodavatele. Při zpožděné úhradě vám budeme účtovat penále 0,05 % za každý započatý den prodlení.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(disclaimerLines, margin, yPos);
  yPos += disclaimerLines.length * 3 + 5;
  
  doc.setFont(fontName, 'normal');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  // ============================================
  // SOUHRNNA TABULKA DPH s barvami
  // ============================================
  const subtotalAmount = (invoice.subtotal || 0).toFixed(2).replace('.', ',');
  const vatAmount = (invoice.vat || 0).toFixed(2).replace('.', ',');
  const totalAmountFormatted = (invoice.total || 0).toFixed(2).replace('.', ',');
  
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
  yPos = doc.lastAutoTable.finalY + 10;
  
  // ============================================
  // RAZITKO A PODPIS s rameckem
  // ============================================
  doc.setFontSize(10);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text('Razítko a podpis:', margin, yPos);
  
  // Signature box
  doc.setDrawColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos + 2, 80, 25);
  yPos += 30;
  
  // ============================================
  // DOLNI CAST - ZAKONCENI s barevnym boxem
  // ============================================
  const bottomY = 270; // Pozice v dolni casti stranky
  
  // Final total box
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, bottomY - 5, contentWidth, 10, 2, 2, 'F');
  
  doc.setFontSize(14);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Celkem k úhradě: ${totalAmountFormatted} ${invoice.currency || 'Kč'}`, margin + 3, bottomY + 2);
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(8);
  doc.setFont(fontName, 'normal');
  const currentDate = new Date().toLocaleDateString('cs-CZ');
  const userName = userData.company_name || 'Systém';
  doc.text(`Vytiskl(a): ${userName}, ${currentDate}`, margin, bottomY + 8);
  
  doc.setTextColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.setFont(fontName, 'italic');
  doc.text('Vystaveno v online fakturační službě Fakturace', margin, bottomY + 12);
  
  // Ulozeni PDF
  doc.save(`Faktura-${invoice.number}.pdf`);
};
