import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEmail } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  type: string; // customer or supplier

  @IsString()
  @IsNotEmpty()
  name: string;

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

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsNumber()
  @IsOptional()
  defaultDiscount?: number;

  @IsNumber()
  @IsOptional()
  defaultDuedays?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  type?: string;

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

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsNumber()
  @IsOptional()
  defaultDiscount?: number;

  @IsNumber()
  @IsOptional()
  defaultDuedays?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isSolvent?: boolean;
}
