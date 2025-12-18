/**
 * Test Data Generator for PDF Pagination Testing
 * 
 * This file contains sample invoice data with many items to test PDF pagination.
 * Import these test data objects in your application to generate test PDFs.
 */

export interface TestInvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export interface TestInvoiceData {
  number: string;
  type: string;
  issue_date: string;
  due_date: string;
  tax_date: string;
  client_name: string;
  client_address: string;
  client_city: string;
  client_zip: string;
  client_ico: string;
  client_dic: string;
  client_is_vat_payer: boolean;
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
  notes: string;
  items: TestInvoiceItem[];
  variable_symbol?: string;
  constant_symbol?: string;
  payment_method?: string;
}

/**
 * Generate test invoice with specified number of items
 */
export const generateTestInvoice = (itemCount: number): TestInvoiceData => {
  const items: TestInvoiceItem[] = [];
  let subtotal = 0;
  let vat = 0;
  
  for (let i = 1; i <= itemCount; i++) {
    const unitPrice = 1000 + (i * 100);
    const quantity = 1 + (i % 5);
    const vatRate = 21;
    const itemSubtotal = unitPrice * quantity;
    const itemVat = itemSubtotal * (vatRate / 100);
    const itemTotal = itemSubtotal + itemVat;
    
    items.push({
      description: `Testovací položka č. ${i} - Služba nebo produkt s delším názvem pro testování zalamování textu`,
      quantity,
      unit_price: unitPrice,
      vat_rate: vatRate,
      total: itemTotal
    });
    
    subtotal += itemSubtotal;
    vat += itemVat;
  }
  
  const total = subtotal + vat;
  
  return {
    number: `TEST-2024-${String(itemCount).padStart(4, '0')}`,
    type: 'invoice',
    issue_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    tax_date: new Date().toISOString(),
    client_name: 'TESTOVACÍ FIRMA s.r.o.',
    client_address: 'Testovací ulice 123',
    client_city: 'Praha',
    client_zip: '110 00',
    client_ico: '12345678',
    client_dic: 'CZ12345678',
    client_is_vat_payer: true,
    subtotal,
    vat,
    total,
    currency: 'CZK',
    notes: 'Toto je testovací faktura pro ověření funkčnosti stránkování PDF.',
    items,
    variable_symbol: String(itemCount).padStart(10, '0'),
    constant_symbol: '0308',
    payment_method: 'Převodem'
  };
};

/**
 * Sample test user data for PDF generation
 */
export const testUserData = {
  company_name: 'TEST DODAVATEL s.r.o.',
  address: 'Dodavatelská 456',
  city: 'Praha',
  zip: '120 00',
  ico: '87654321',
  dic: 'CZ87654321',
  email: 'info@testdodavatel.cz',
  phone: '+420 123 456 789',
  website: 'www.testdodavatel.cz',
  bank_account: '123456789/0100',
  iban: 'CZ6508000000192000145399',
  swift: 'KOMBCZPP'
};

// Pre-defined test cases

/**
 * Single page invoice (5 items - should fit on one page)
 */
export const singlePageInvoice = generateTestInvoice(5);

/**
 * Two page invoice (15 items - should span two pages)
 */
export const twoPageInvoice = generateTestInvoice(15);

/**
 * Three page invoice (30 items - should span three pages)
 */
export const threePageInvoice = generateTestInvoice(30);

/**
 * Large invoice (50 items - should span multiple pages)
 */
export const largeInvoice = generateTestInvoice(50);

// Usage example:
// import { generateTestInvoice, testUserData } from './testDataGenerator';
// import { generateInvoicePDF } from '../utils/pdfGenerator';
// 
// const testInvoice = generateTestInvoice(20);
// await generateInvoicePDF(testInvoice, testUserData);
