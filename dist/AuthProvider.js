import { defineComponent, reactive, provide, onMounted, onUnmounted, } from 'vue';
function decodeJWT(token) {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
}
export const AUTH_INJECTION_KEY = Symbol('auth');
export const AuthProvider = defineComponent({
    name: 'AuthProvider',
    props: {
        config: {
            type: Object,
            required: true,
        },
    },
    setup(props, { slots }) {
        const { authUrl, clientId, appUrl, apiUrl } = props.config;
        const baseApiUrl = apiUrl || appUrl;
        let refreshTimer;
        let refreshLock = false;
        const state = reactive({
            isAuthenticated: false,
            isLoading: true,
            user: null,
            organization: null,
            tenant: null,
            isAdmin: false,
            isOwner: false,
            orgRole: 'member',
            isSuperAdmin: false,
            isPlatformAdmin: false,
            accessToken: null,
            getAccessToken,
            login,
            logout,
            switchOrganization,
            organizations: [],
            isLoggingOut: false,
            isLoggingIn: false,
            loginError: null,
            impersonating: false,
        });
        function updateFromToken(token) {
            const payload = decodeJWT(token);
            state.user = {
                id: payload.sub,
                email: payload.email,
                name: payload.name || 'User',
                role: payload.org?.role === 'owner' || payload.org?.role === 'admin' ? 'admin' : 'member',
                imageUrl: payload.avatarUrl,
            };
            if (payload.org) {
                state.organization = {
                    id: payload.org.id,
                    name: payload.org.name,
                    slug: payload.org.slug,
                    imageUrl: null,
                };
                state.orgRole = payload.org.role;
                state.tenant = {
                    id: payload.org.id,
                    name: payload.org.name,
                    slug: payload.org.slug,
                };
            }
            else {
                state.organization = null;
                state.orgRole = 'member';
                state.tenant = null;
            }
            state.isSuperAdmin = payload.isSuperAdmin;
            state.isPlatformAdmin = payload.isSuperAdmin;
            state.accessToken = token;
            state.isAdmin = state.orgRole === 'admin' || state.orgRole === 'owner';
            state.isOwner = state.orgRole === 'owner';
            state.isAuthenticated = !!token && !!state.organization;
            return payload;
        }
        async function refreshToken() {
            if (refreshLock)
                return null;
            refreshLock = true;
            try {
                const res = await fetch(`${baseApiUrl}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) {
                    state.accessToken = null;
                    state.user = null;
                    state.organization = null;
                    state.tenant = null;
                    state.isAuthenticated = false;
                    state.isAdmin = false;
                    state.isOwner = false;
                    state.isSuperAdmin = false;
                    state.isPlatformAdmin = false;
                    return null;
                }
                const data = await res.json();
                const payload = updateFromToken(data.access_token);
                // Schedule next refresh 1 minute before expiry
                const expiresIn = payload.exp * 1000 - Date.now();
                const refreshIn = Math.max(expiresIn - 60000, 10000);
                if (refreshTimer)
                    clearTimeout(refreshTimer);
                refreshTimer = setTimeout(() => {
                    refreshToken();
                }, refreshIn);
                return data.access_token;
            }
            catch {
                return null;
            }
            finally {
                refreshLock = false;
            }
        }
        async function fetchOrganizations(token) {
            try {
                const res = await fetch(`${authUrl}/api/organizations`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    state.organizations = data.organizations || [];
                }
            }
            catch {
                // Silent failure — orgs list is supplementary
            }
        }
        function login(provider) {
            const redirectUri = `${appUrl}/auth/callback`;
            const loginState = btoa(JSON.stringify({ returnTo: window.location.pathname }));
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                state: loginState,
            });
            if (provider)
                params.set('provider', provider);
            window.location.href = `${authUrl}/authorize?${params}`;
        }
        async function logout() {
            state.isLoggingOut = true;
            try {
                await fetch(`${baseApiUrl}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include',
                });
            }
            catch {
                // Best-effort
            }
            if (refreshTimer)
                clearTimeout(refreshTimer);
            state.accessToken = null;
            state.user = null;
            state.organization = null;
            state.tenant = null;
            state.organizations = [];
            state.isAuthenticated = false;
            state.isAdmin = false;
            state.isOwner = false;
            state.isSuperAdmin = false;
            state.isPlatformAdmin = false;
            state.isLoggingOut = false;
        }
        async function switchOrganization(orgId) {
            try {
                const res = await fetch(`${baseApiUrl}/auth/switch-org`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ org_id: orgId }),
                });
                if (res.ok) {
                    const data = await res.json();
                    updateFromToken(data.access_token);
                }
            }
            catch {
                // Silent failure
            }
        }
        async function getAccessToken() {
            if (state.accessToken) {
                try {
                    const payload = decodeJWT(state.accessToken);
                    if (payload.exp * 1000 - Date.now() > 60000) {
                        return state.accessToken;
                    }
                }
                catch {
                    // Fall through to refresh
                }
            }
            return refreshToken();
        }
        provide(AUTH_INJECTION_KEY, state);
        onMounted(async () => {
            const token = await refreshToken();
            if (token) {
                await fetchOrganizations(token);
            }
            state.isLoading = false;
        });
        onUnmounted(() => {
            if (refreshTimer)
                clearTimeout(refreshTimer);
        });
        return () => slots.default?.();
    },
});
/** Vue plugin factory for convenient app.use() installation */
export function createAuthPlugin(config) {
    return {
        install(app) {
            // Register the AuthProvider component globally
            app.component('AuthProvider', AuthProvider);
            // We can't provide the reactive state here because it's created inside the component.
            // Consumers must wrap their app with <AuthProvider :config="config">
            // and use useAuth() inside child components.
            // Store config for AuthCallback to use
            app.provide(AUTH_CONFIG_KEY, config);
        },
    };
}
export const AUTH_CONFIG_KEY = Symbol('auth-config');
//# sourceMappingURL=AuthProvider.js.map