import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SellerApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  legalName!: string;

  @IsString()
  @Matches(/^[0-9A-Z]{15}$/)
  gstNumber!: string;

  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
  panNumber!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/)
  phone!: string;
}
