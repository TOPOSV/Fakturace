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

export const generateInvoiceNumber = (type: string, year: number, sequence: number): string => {
  const prefix = type === 'invoice' ? 'FA' : type === 'proforma' ? 'ZF' : 'NB';
  return `${prefix}${year}${String(sequence).padStart(4, '0')}`;
};
