import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  vatRate: number;

  @IsNumber()
  @IsOptional()
  discount?: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsOptional()
  type?: string; // standard, proforma, credit_note

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  variableSymbol?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
