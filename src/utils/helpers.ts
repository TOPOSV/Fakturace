import axios from 'axios';

export interface AresData {
  ico: string;
  company_name: string;
  dic?: string;
  address?: string;
  city?: string;
  zip?: string;
}

export const lookupICO = async (ico: string): Promise<AresData | null> => {
  try {
    // Using the ARES API to lookup company data by ICO
    const response = await axios.get(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
    
    if (response.data) {
      const data = response.data;
      const sidlo = data.sidlo;
      
      return {
        ico: data.ico,
        company_name: data.obchodniJmeno || '',
        dic: data.dic || '',
        address: sidlo?.textovaAdresa || '',
        city: sidlo?.nazevObce || '',
        zip: sidlo?.psc ? sidlo.psc.toString() : '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error looking up ICO:', error);
    return null;
  }
};

export const calculateVAT = (amount: number, vatRate: number = 21): { subtotal: number; vatAmount: number; total: number } => {
  const subtotal = amount;
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

export const generateInvoiceNumber = (type: string, year: number, sequence: number, format: string = 'year_4'): string => {
  // Parse format: year_3, year_4, year_5, or custom (which defaults to year_4)
  let digits = 4; // default
  
  if (format === 'year_3') {
    digits = 3;
  } else if (format === 'year_4') {
    digits = 4;
  } else if (format === 'year_5') {
    digits = 5;
  }
  
  // Generate invoice number WITHOUT prefix (just numbers for variable symbol compatibility)
  return `${year}${String(sequence).padStart(digits, '0')}`;
};
