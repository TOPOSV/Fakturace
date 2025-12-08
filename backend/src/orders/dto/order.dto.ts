import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  offerId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  totalAmount: number;
}

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;
}

export class CreateOrderTimelineDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsString()
  @IsOptional()
  description?: string;
}
