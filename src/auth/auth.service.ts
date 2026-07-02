import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TokenStatus, UserStatus, type User } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { Environment } from '@config/environment';
import { hashPassword, verifyPassword } from './utils/password.util';
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from './utils/token.util';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthResponseDto, AuthenticatedUserDto, AuthTokensDto } from './auth.types';
import type { AuthUser } from './interfaces/auth-user.interface';

type UserWithRoles = User & {
  roles: { role: { name: string } }[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await hashPassword(dto.password);

    try {
      const user = await this.prisma.runInTransaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            phone: dto.phone ?? null,
            firstName: dto.firstName,
            lastName: dto.lastName,
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });

        const customerRole = await tx.role.upsert({
          where: { name: 'customer' },
          update: {},
          create: { name: 'customer', description: 'Marketplace customer' },
        });

        await tx.userRole.create({
          data: { userId: createdUser.id, roleId: customerRole.id },
        });

        return await tx.user.findUniqueOrThrow({
          where: { id: createdUser.id },
          include: { roles: { include: { role: true } } },
        });
      });

      return await this.issueAuthResponse(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with this email or phone already exists.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!user?.passwordHash || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active.');
    }

    return this.issueAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    if (
      !storedToken?.user ||
      storedToken.status !== TokenStatus.ACTIVE ||
      storedToken.expiresAt <= new Date() ||
      storedToken.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { status: TokenStatus.REVOKED, revokedAt: new Date() },
    });

    return this.issueAuthResponse(storedToken.user);
  }

  async logout(refreshToken: string): Promise<{ revoked: true }> {
    const tokenHash = hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, status: TokenStatus.ACTIVE },
      data: { status: TokenStatus.REVOKED, revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async getCurrentUser(user: AuthUser): Promise<AuthenticatedUserDto> {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } },
    });

    if (!foundUser) throw new UnauthorizedException('User not found.');
    return this.toUserDto(foundUser);
  }

  private async issueAuthResponse(user: UserWithRoles): Promise<AuthResponseDto> {
    const tokens = await this.issueTokens(user);
    return { user: this.toUserDto(user), ...tokens };
  }

  private async issueTokens(user: UserWithRoles): Promise<AuthTokensDto> {
    const roles = user.roles.map(({ role }) => role.name);
    const accessToken = createAccessToken(
      { sub: user.id, email: user.email, roles },
      this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
    );
    const refreshToken = createRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshTokenExpiry(this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true })),
      },
    });

    return { accessToken, refreshToken };
  }

  private toUserDto(user: UserWithRoles): AuthenticatedUserDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.roles.map(({ role }) => role.name),
    };
  }
}
