import { inject } from 'vue';
import { AUTH_INJECTION_KEY } from './AuthProvider.js';
import type { AuthState } from './types.js';

export function useAuth(): AuthState {
  const state = inject(AUTH_INJECTION_KEY);
  if (!state) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return state;
}
