import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AresService {
  private readonly aresUrl: string;

  constructor(private configService: ConfigService) {
    this.aresUrl = this.configService.get<string>('ARES_API_URL') || 
      'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty';
  }

  async getCompanyInfo(ico: string) {
    try {
      const response = await fetch(`${this.aresUrl}/${ico}`);
      
      if (!response.ok) {
        throw new HttpException('Company not found in ARES', 404);
      }

      const data = await response.json();
      
      // Parse ARES response
      const sidlo = data.sidlo || {};
      const dic = data.dic?.[0] || null;

      return {
        ico: data.ico,
        name: data.obchodniJmeno,
        dic: dic,
        isVatPayer: !!dic,
        street: sidlo.textovaAdresa || '',
        city: sidlo.nazevObce || '',
        postalCode: sidlo.psc?.toString() || '',
        country: 'CZ',
      };
    } catch (error) {
      console.error('ARES API error:', error);
      throw new HttpException('Failed to fetch company info from ARES', 500);
    }
  }

  async validateICO(ico: string): Promise<boolean> {
    try {
      await this.getCompanyInfo(ico);
      return true;
    } catch (error) {
      return false;
    }
  }
}
