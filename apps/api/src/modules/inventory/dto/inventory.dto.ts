import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateHoldDto {
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @IsOptional()
  @IsString()
  ticketTypeId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  ttlSeconds?: number;
}

export class SetInventoryDto {
  @IsInt()
  @Min(0)
  available: number;
}
