import { jsPDF } from 'jspdf';

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
  // User/company data
  company_name?: string;
  company_address?: string;
  company_ico?: string;
  company_dic?: string;
}

export const generateInvoicePDF = async (invoice: InvoiceData, userData: any) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Title
  const typeText = invoice.type === 'invoice' ? 'FAKTURA' : 
                   invoice.type === 'proforma' ? 'ZÁLOHOVÁ FAKTURA' : 'NABÍDKA';
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(typeText, 20, 20);
  
  // Invoice number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Číslo: ${invoice.number}`, 20, 30);
  
  // Supplier info (left side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Dodavatel:', 20, 45);
  doc.setFont('helvetica', 'normal');
  let yPos = 50;
  if (userData.company_name) {
    doc.text(userData.company_name, 20, yPos);
    yPos += 5;
  }
  if (userData.address) {
    doc.text(userData.address, 20, yPos);
    yPos += 5;
  }
  if (userData.city && userData.zip) {
    doc.text(`${userData.zip} ${userData.city}`, 20, yPos);
    yPos += 5;
  }
  if (userData.ico) {
    doc.text(`IČO: ${userData.ico}`, 20, yPos);
    yPos += 5;
  }
  if (userData.dic) {
    doc.text(`DIČ: ${userData.dic}`, 20, yPos);
    yPos += 5;
  }
  
  // Client info (right side)
  doc.setFont('helvetica', 'bold');
  doc.text('Odběratel:', 120, 45);
  doc.setFont('helvetica', 'normal');
  yPos = 50;
  if (invoice.client_name) {
    doc.text(invoice.client_name, 120, yPos);
    yPos += 5;
  }
  if (invoice.client_address) {
    doc.text(invoice.client_address, 120, yPos);
    yPos += 5;
  }
  if (invoice.client_city && invoice.client_zip) {
    doc.text(`${invoice.client_zip} ${invoice.client_city}`, 120, yPos);
    yPos += 5;
  }
  if (invoice.client_ico) {
    doc.text(`IČO: ${invoice.client_ico}`, 120, yPos);
    yPos += 5;
  }
  if (invoice.client_dic) {
    doc.text(`DIČ: ${invoice.client_dic}`, 120, yPos);
    yPos += 5;
  }
  
  // Dates section
  yPos = Math.max(yPos, 75) + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Datum vystavení:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.issue_date).toLocaleDateString('cs-CZ'), 60, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Datum splatnosti:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.due_date).toLocaleDateString('cs-CZ'), 60, yPos);
  
  if (invoice.tax_date) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Datum zdanění:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.tax_date).toLocaleDateString('cs-CZ'), 60, yPos);
  }
  
  // Items table
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Položky:', 20, yPos);
  
  yPos += 5;
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 170, 7, 'F');
  doc.setFontSize(9);
  doc.text('Popis', 22, yPos + 5);
  doc.text('Množství', 110, yPos + 5);
  doc.text('Cena/ks', 135, yPos + 5);
  doc.text('DPH %', 155, yPos + 5);
  doc.text('Celkem', 175, yPos + 5);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  
  // Table rows
  invoice.items.forEach((item) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    const desc = doc.splitTextToSize(item.description, 85);
    doc.text(desc[0] || '', 22, yPos + 5);
    doc.text(item.quantity.toString(), 112, yPos + 5, { align: 'center' });
    doc.text(`${item.unit_price.toFixed(2)}`, 145, yPos + 5, { align: 'right' });
    doc.text(`${item.vat_rate}`, 160, yPos + 5, { align: 'center' });
    doc.text(`${item.total.toFixed(2)}`, 188, yPos + 5, { align: 'right' });
    
    yPos += 7;
  });
  
  // Totals
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Mezisoučet bez DPH:', 120, yPos);
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 188, yPos, { align: 'right' });
  
  yPos += 7;
  doc.text('DPH:', 120, yPos);
  doc.text(`${invoice.vat.toFixed(2)} ${invoice.currency}`, 188, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFontSize(12);
  doc.text('Celkem k úhradě:', 120, yPos);
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 188, yPos, { align: 'right' });
  
  // Notes
  if (invoice.notes) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Poznámky:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    const lines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(lines, 20, yPos);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Děkujeme za Vaši důvěru!', 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`${invoice.number}.pdf`);
};
