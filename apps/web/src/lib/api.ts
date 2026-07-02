import { createApiClient } from '@nova/api-client';

export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getAccessToken: () => null,
});
