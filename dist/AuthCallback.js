import { defineComponent, ref, onMounted, inject, h } from 'vue';
import { AUTH_INJECTION_KEY, AUTH_RESOLVED_CONFIG_KEY } from './AuthProvider.js';
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
        const error = ref(null);
        const exchanged = ref(false);
        // Try to get resolved config and auth state from provider injection
        const config = inject(AUTH_RESOLVED_CONFIG_KEY, undefined);
        const auth = inject(AUTH_INJECTION_KEY, undefined);
        onMounted(async () => {
            // Guard against double-firing
            if (exchanged.value)
                return;
            exchanged.value = true;
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const errorParam = params.get('error');
            if (errorParam) {
                error.value = errorParam;
                if (props.onError) {
                    props.onError(errorParam);
                }
                else {
                    // No error handler — redirect to login with error context
                    let returnTo = '/';
                    if (state) {
                        try {
                            const decoded = JSON.parse(atob(state));
                            returnTo = decoded.returnTo || '/';
                        }
                        catch { /* ignore */ }
                    }
                    const loginUrl = new URL('/login', window.location.origin);
                    loginUrl.searchParams.set('error', errorParam);
                    if (returnTo !== '/')
                        loginUrl.searchParams.set('returnTo', returnTo);
                    window.location.href = loginUrl.toString();
                }
                return;
            }
            if (!code) {
                error.value = 'Missing authorization code';
                if (props.onError)
                    props.onError('Missing authorization code');
                return;
            }
            const baseUrl = props.apiUrl || config?.apiUrl || config?.appUrl || window.location.origin;
            try {
                const res = await fetch(`${baseUrl}/api/auth/callback?code=${encodeURIComponent(code)}`, {
                    credentials: 'include',
                });
                if (!res.ok) {
                    let errorMessage;
                    try {
                        const data = await res.json();
                        errorMessage = data.error || data.message || `Callback failed: ${res.status}`;
                    }
                    catch {
                        const text = await res.text();
                        errorMessage = text || `Callback failed: ${res.status} ${res.statusText}`;
                    }
                    throw new Error(errorMessage);
                }
                // Sync AuthProvider state from the new refresh cookie so
                // isAuthenticated updates immediately (no full page reload needed)
                if (auth?.refreshSession) {
                    const refreshResult = await auth.refreshSession();
                    if (refreshResult === null) {
                        const msg = 'Failed to refresh session after authentication callback';
                        error.value = msg;
                        if (props.onError) {
                            props.onError(msg);
                        }
                        return;
                    }
                }
                // Decode state to get returnTo path
                let returnTo = '/';
                if (state) {
                    try {
                        const decoded = JSON.parse(atob(state));
                        returnTo = decoded.returnTo || '/';
                    }
                    catch {
                        // Invalid state — default to /
                    }
                }
                if (props.onSuccess) {
                    props.onSuccess(returnTo);
                }
                else {
                    window.location.href = returnTo;
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Authentication failed';
                error.value = message;
                if (props.onError)
                    props.onError(message);
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
//# sourceMappingURL=AuthCallback.js.map