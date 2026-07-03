'use client';

import * as React from 'react';
import type { AuthenticatedUserDto, LoginRequestDto, RegisterRequestDto, UserProfileDto } from '@nova/types';
import { NovaApiError } from '@nova/api-client';
import { apiClient } from '@/lib/api';
import { clearStoredTokens, getStoredTokens, storeAuthResponse } from '@/lib/auth-storage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthenticatedUserDto | null;
  profile: UserProfileDto | null;
  error: string | null;
  login: (payload: LoginRequestDto) => Promise<void>;
  register: (payload: RegisterRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>('loading');
  const [user, setUser] = React.useState<AuthenticatedUserDto | null>(null);
  const [profile, setProfile] = React.useState<UserProfileDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async () => {
    const [currentUser, currentProfile] = await Promise.all([apiClient.auth.me(), apiClient.account.getProfile()]);
    setUser(currentUser);
    setProfile(currentProfile);
    setStatus('authenticated');
  }, []);

  const refreshSession = React.useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens) {
      setStatus('unauthenticated');
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      await loadProfile();
      setError(null);
    } catch (error) {
      if (error instanceof NovaApiError && error.status === 401) {
        try {
          const refreshed = await apiClient.auth.refresh({ refreshToken: tokens.refreshToken });
          storeAuthResponse(refreshed);
          setUser(refreshed.user);
          const currentProfile = await apiClient.account.getProfile();
          setProfile(currentProfile);
          setStatus('authenticated');
          setError(null);
          return;
        } catch (refreshError) {
          clearStoredTokens();
          setUser(null);
          setProfile(null);
          setStatus('unauthenticated');
          setError(toAuthMessage(refreshError));
          return;
        }
      }

      setStatus('unauthenticated');
      setError(toAuthMessage(error));
    }
  }, [loadProfile]);

  React.useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = React.useCallback(
    async (payload: LoginRequestDto) => {
      setStatus('loading');
      setError(null);
      try {
        const response = await apiClient.auth.login(payload);
        storeAuthResponse(response);
        setUser(response.user);
        const currentProfile = await apiClient.account.getProfile();
        setProfile(currentProfile);
        setStatus('authenticated');
      } catch (error) {
        clearStoredTokens();
        setStatus('unauthenticated');
        setError(toAuthMessage(error));
        throw error;
      }
    },
    [],
  );

  const register = React.useCallback(
    async (payload: RegisterRequestDto) => {
      setStatus('loading');
      setError(null);
      try {
        const response = await apiClient.auth.register(payload);
        storeAuthResponse(response);
        setUser(response.user);
        const currentProfile = await apiClient.account.getProfile();
        setProfile(currentProfile);
        setStatus('authenticated');
      } catch (error) {
        clearStoredTokens();
        setStatus('unauthenticated');
        setError(toAuthMessage(error));
        throw error;
      }
    },
    [],
  );

  const logout = React.useCallback(async () => {
    const tokens = getStoredTokens();
    clearStoredTokens();
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');

    if (tokens) {
      try {
        await apiClient.auth.logout({ refreshToken: tokens.refreshToken });
      } catch {
        // Local logout must succeed even if the API is unavailable.
      }
    }
  }, []);

  const value = React.useMemo(
    () => ({ status, user, profile, error, login, register, logout, refreshSession }),
    [status, user, profile, error, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

function toAuthMessage(error: unknown): string {
  if (error instanceof NovaApiError) return error.message;
  return 'Authentication failed. Please try again.';
}
