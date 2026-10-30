import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Matches, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// El precio no se acepta del cliente en producción: se toma del tipo de entrada del evento (o unitPrice en tests).
export class CreateOrderItemDto {
  // UUID o legacyId (e1, e2...).
  @IsString()
  @IsNotEmpty()
  eventId: string;

  // Id o nombre del tipo de entrada (por ejemplo "tt1a" o "General").
  @IsString()
  @IsNotEmpty()
  ticketType: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class PayOrderDto {
  @Matches(/^[\d ]{12,23}$/, { message: 'card must contain 12 to 19 digits' })
  card: string;
}
