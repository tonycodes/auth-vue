import { ref, onMounted, inject } from 'vue';
import { AUTH_CONFIG_KEY } from './AuthProvider.js';
import type { AuthConfig } from './types.js';

export interface ProviderInfo {
  id: string;
  name: string;
  enabled: boolean;
}

export interface UseProvidersResult {
  providers: typeof ref<ProviderInfo[]>;
  isLoading: typeof ref<boolean>;
  error: typeof ref<string | null>;
}

/**
 * Composable to fetch available SSO providers for the current organization.
 * Automatically fetches providers based on the client_id from AuthProvider config.
 */
export function useProviders() {
  const config = inject<AuthConfig>(AUTH_CONFIG_KEY);
  const providers = ref<ProviderInfo[]>([]);
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  onMounted(async () => {
    if (!config) {
      error.value = 'AuthProvider not found';
      isLoading.value = false;
      return;
    }

    try {
      const url = new URL(`${config.authUrl}/providers`);
      url.searchParams.set('client_id', config.clientId);

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Failed to fetch providers: ${res.status}`);
      }

      const data = await res.json();
      providers.value = data.providers || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch providers';
    } finally {
      isLoading.value = false;
    }
  });

  return { providers, isLoading, error };
}
