import { defineComponent, ref, onMounted, inject, h } from 'vue';
import { AUTH_RESOLVED_CONFIG_KEY } from './AuthProvider.js';
import type { ResolvedAuthConfig } from './types.js';

/**
 * Component that handles the OAuth callback.
 * Mount at /auth/callback route.
 *
 * Exchanges the authorization code for tokens via the backend proxy,
 * then redirects to the original page.
 */
export const AuthCallback = defineComponent({
  name: 'AuthCallback',
  props: {
    apiUrl: { type: String, default: undefined },
    onSuccess: { type: Function, default: undefined },
    onError: { type: Function, default: undefined },
  },
  setup(props) {
    const error = ref<string | null>(null);
    const exchanged = ref(false);

    // Try to get resolved config from provider injection
    const config = inject<ResolvedAuthConfig>(AUTH_RESOLVED_CONFIG_KEY, undefined as unknown as ResolvedAuthConfig);

    onMounted(async () => {
      // Guard against double-firing
      if (exchanged.value) return;
      exchanged.value = true;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');

      if (errorParam) {
        error.value = errorParam;
        if (props.onError) {
          (props.onError as (e: string) => void)(errorParam);
        } else {
          // No error handler — redirect to login with error context
          let returnTo = '/';
          if (state) {
            try {
              const decoded = JSON.parse(atob(state));
              returnTo = decoded.returnTo || '/';
            } catch { /* ignore */ }
          }
          const loginUrl = new URL('/login', window.location.origin);
          loginUrl.searchParams.set('error', errorParam);
          if (returnTo !== '/') loginUrl.searchParams.set('returnTo', returnTo);
          window.location.href = loginUrl.toString();
        }
        return;
      }

      if (!code) {
        error.value = 'Missing authorization code';
        if (props.onError) (props.onError as (e: string) => void)('Missing authorization code');
        return;
      }

      const baseUrl = props.apiUrl || config?.apiUrl || config?.appUrl || window.location.origin;

      try {
        const res = await fetch(`${baseUrl}/auth/callback?code=${encodeURIComponent(code)}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Authentication failed');
        }

        // Decode state to get returnTo path
        let returnTo = '/';
        if (state) {
          try {
            const decoded = JSON.parse(atob(state));
            returnTo = decoded.returnTo || '/';
          } catch {
            // Invalid state — default to /
          }
        }

        if (props.onSuccess) {
          (props.onSuccess as (returnTo: string) => void)(returnTo);
        } else {
          window.location.href = returnTo;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        error.value = message;
        if (props.onError) (props.onError as (e: string) => void)(message);
      }
    });

    return () => {
      if (error.value) {
        return h('div', { style: 'padding: 2rem; text-align: center;' }, [
          h('h2', null, 'Authentication Failed'),
          h('p', null, error.value),
          h('a', { href: '/' }, 'Go Home'),
        ]);
      }

      return h('div', { style: 'padding: 2rem; text-align: center;' }, [
        h('p', null, 'Signing in...'),
      ]);
    };
  },
});
