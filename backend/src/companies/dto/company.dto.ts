import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ico: string;

  @IsString()
  @IsOptional()
  dic?: string;

  @IsBoolean()
  @IsOptional()
  isVatPayer?: boolean;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  iban?: string;

  @IsString()
  @IsOptional()
  swift?: string;

  @IsString()
  @IsOptional()
  invoicePrefix?: string;

  @IsString()
  @IsOptional()
  offerPrefix?: string;

  @IsNumber()
  @IsOptional()
  defaultVatRate?: number;

  @IsNumber()
  @IsOptional()
  defaultDuedays?: number;
}

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  ico?: string;

  @IsString()
  @IsOptional()
  dic?: string;

  @IsBoolean()
  @IsOptional()
  isVatPayer?: boolean;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  iban?: string;

  @IsString()
  @IsOptional()
  swift?: string;

  @IsString()
  @IsOptional()
  invoicePrefix?: string;

  @IsString()
  @IsOptional()
  offerPrefix?: string;

  @IsNumber()
  @IsOptional()
  defaultVatRate?: number;

  @IsNumber()
  @IsOptional()
  defaultDuedays?: number;
}
