import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  // A4 format with 20mm margins (converted to points: 1mm = 2.834645669 points)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const margin = 20; // 20mm margins
  const pageWidth = 210; // A4 width in mm
  const contentWidth = pageWidth - (2 * margin);
  
  // Set default font
  doc.setFont('helvetica');
  
  // ============================================
  // HLAVNÍ NADPIS - Faktura – daňový doklad
  // ============================================
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const typeText = invoice.type === 'invoice' ? 'Faktura – daňový doklad' : 
                   invoice.type === 'proforma' ? 'Zálohová faktura' : 'Nabídka';
  doc.text(typeText, margin, margin + 10);
  
  // Číslo faktury
  doc.setFontSize(14);
  doc.text(`Číslo: ${invoice.number}`, margin, margin + 18);
  
  // ============================================
  // DVA BLOKY VEDLE SEBE - Dodavatel a Odběratel
  // ============================================
  let yPos = margin + 30;
  const col1X = margin;
  const col2X = margin + (contentWidth / 2) + 10;
  
  // DODAVATEL (levý sloupec)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Dodavatel:', col1X, yPos);
  
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  if (userData.company_name) {
    doc.text(userData.company_name, col1X, yPos);
    yPos += 5;
  }
  if (userData.address) {
    doc.text(userData.address, col1X, yPos);
    yPos += 5;
  }
  if (userData.zip && userData.city) {
    doc.text(`${userData.zip} ${userData.city}`, col1X, yPos);
    yPos += 5;
  }
  doc.text('Česká republika', col1X, yPos);
  yPos += 5;
  
  if (userData.ico) {
    doc.text(`IČ: ${userData.ico}`, col1X, yPos);
    yPos += 5;
  }
  if (userData.dic) {
    doc.text(`DIČ: ${userData.dic}`, col1X, yPos);
    yPos += 5;
  }
  if (userData.email) {
    doc.text(`E-mail: ${userData.email}`, col1X, yPos);
    yPos += 5;
  }
  if (userData.phone) {
    doc.text(`Telefon: ${userData.phone}`, col1X, yPos);
    yPos += 5;
  }
  if (userData.website) {
    doc.text(`Web: ${userData.website}`, col1X, yPos);
    yPos += 5;
  }
  
  const supplierEndY = yPos;
  
  // ODBĚRATEL (pravý sloupec)
  yPos = margin + 30;
  doc.setFont('helvetica', 'bold');
  doc.text('Odběratel:', col2X, yPos);
  
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  if (invoice.client_name) {
    doc.text(invoice.client_name, col2X, yPos);
    yPos += 5;
  }
  if (invoice.client_address) {
    doc.text(invoice.client_address, col2X, yPos);
    yPos += 5;
  }
  if (invoice.client_zip && invoice.client_city) {
    doc.text(`${invoice.client_zip} ${invoice.client_city}`, col2X, yPos);
    yPos += 5;
  }
  doc.text('Česká republika', col2X, yPos);
  yPos += 5;
  
  if (invoice.client_ico) {
    doc.text(`IČ: ${invoice.client_ico}`, col2X, yPos);
    yPos += 5;
  }
  if (invoice.client_dic) {
    doc.text(`DIČ: ${invoice.client_dic}`, col2X, yPos);
    yPos += 5;
  }
  
  // ============================================
  // TŘI DATUMY V JEDNÉ ŘÁDCE
  // ============================================
  yPos = Math.max(supplierEndY, yPos) + 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  const dateY = yPos;
  doc.text('Datum vystavení:', margin, dateY);
  doc.text('Datum zdanitelného plnění:', margin + 55, dateY);
  doc.text('Datum splatnosti:', margin + 125, dateY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.issue_date).toLocaleDateString('cs-CZ'), margin, dateY + 5);
  doc.text(new Date(invoice.tax_date || invoice.issue_date).toLocaleDateString('cs-CZ'), margin + 55, dateY + 5);
  doc.text(new Date(invoice.due_date).toLocaleDateString('cs-CZ'), margin + 125, dateY + 5);
  
  // ============================================
  // BANKOVNÍ ÚDAJE
  // ============================================
  yPos = dateY + 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bankovní údaje:', margin, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  yPos += 5;
  
  if (userData.bank_account) {
    doc.text(`Číslo účtu: ${userData.bank_account}`, margin, yPos);
    yPos += 5;
  }
  if (userData.iban) {
    doc.text(`IBAN: ${userData.iban}`, margin, yPos);
    yPos += 5;
  }
  if (userData.swift) {
    doc.text(`SWIFT: ${userData.swift}`, margin, yPos);
    yPos += 5;
  }
  if (invoice.variable_symbol) {
    doc.text(`Variabilní symbol: ${invoice.variable_symbol}`, margin, yPos);
    yPos += 5;
  }
  if (invoice.constant_symbol) {
    doc.text(`Konstantní symbol: ${invoice.constant_symbol}`, margin, yPos);
    yPos += 5;
  }
  const paymentMethod = invoice.payment_method || 'Převodem';
  doc.text(`Způsob platby: ${paymentMethod}`, margin, yPos);
  yPos += 5;
  
  // ============================================
  // VELKÝ ZVÝRAZNĚNÝ TEXT - K ÚHRADĚ
  // ============================================
  yPos += 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const totalAmount = (invoice.total || 0).toFixed(2).replace('.', ',');
  const totalText = `K úhradě: ${totalAmount} ${invoice.currency || 'Kč'}`;
  doc.text(totalText, margin, yPos);
  
  // ============================================
  // TABULKA POLOŽEK (jspdf-autotable)
  // ============================================
  yPos += 10;
  
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
    head: [['Označení dodávky', 'Počet m.j.', 'Cena za m.j.', 'DPH %', 'Bez DPH', 'DPH', 'Celkem']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });
  
  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 5;
  
  // ============================================
  // TEXT POD TABULKOU (drobné písmo)
  // ============================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const disclaimerText = 'Zboží zůstává až do úplného uhrazení majetkem dodavatele. Při zpožděné úhradě vám budeme účtovat penále 0,05 % za každý započatý den prodlení.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(disclaimerLines, margin, yPos);
  yPos += disclaimerLines.length * 3 + 5;
  
  // ============================================
  // SOUHRNNÁ TABULKA DPH
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
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      halign: 'right'
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    margin: { left: margin + 100, right: margin }
  });
  
  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;
  
  // ============================================
  // RAZÍTKO A PODPIS
  // ============================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Razítko a podpis:', margin, yPos);
  yPos += 20;
  
  // ============================================
  // DOLNÍ ČÁST - ZAKONČENÍ
  // ============================================
  const bottomY = 280; // Pozice v dolní části stránky
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Celkem k úhradě: ${totalAmountFormatted} ${invoice.currency || 'Kč'}`, margin, bottomY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('cs-CZ');
  const userName = userData.company_name || 'Systém';
  doc.text(`Vytiskl(a): ${userName}, ${currentDate}`, margin, bottomY + 5);
  doc.text('Vystaveno v online fakturační službě Fakturace', margin, bottomY + 10);
  
  // Uložení PDF
  doc.save(`Faktura-${invoice.number}.pdf`);
};
