import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateHoldDto {
  @IsInt()
  @Min(1)
  quantity: number;

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
