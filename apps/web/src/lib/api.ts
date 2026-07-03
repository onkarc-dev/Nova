import { createApiClient } from '@nova/api-client';
import { getStoredTokens } from '@/lib/auth-storage';

export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getAccessToken: () => getStoredTokens()?.accessToken ?? null,
});
