import type { UserStatus } from '@prisma/client';

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: string[];
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: AuthenticatedUserDto;
}
