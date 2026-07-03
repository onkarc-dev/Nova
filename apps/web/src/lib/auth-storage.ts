import type { AuthResponseDto, AuthTokensDto } from '@nova/types';

const STORAGE_KEY = 'nova.auth.tokens';

export function getStoredTokens(): AuthTokensDto | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthTokensDto>;
    if (typeof parsed.accessToken === 'string' && typeof parsed.refreshToken === 'string') {
      return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
    }
  } catch {
    clearStoredTokens();
  }

  return null;
}

export function storeAuthResponse(response: AuthResponseDto): AuthTokensDto {
  const tokens = { accessToken: response.accessToken, refreshToken: response.refreshToken };
  storeTokens(tokens);
  return tokens;
}

export function storeTokens(tokens: AuthTokensDto): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
