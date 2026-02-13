import { defineComponent, reactive, ref, provide, inject, onMounted, onUnmounted, } from 'vue';
import { validateConfig } from './validateConfig.js';
const DEFAULT_AUTH_URL = 'https://auth.tony.codes';
function decodeJWT(token) {
    try {
        const base64 = token.split('.')[1];
        if (!base64)
            throw new Error('Invalid token structure');
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
    }
    catch {
        throw new Error('Failed to decode access token — the token may be malformed');
    }
}
/**
 * Resolve config by discovering missing URLs from the auth service.
 * 1. If appUrl provided explicitly → use it, skip discovery
 * 2. Otherwise → fetch from /api/client-apps/:clientId/config
 * 3. Fallback → use window.location.origin
 */
async function resolveConfig(config) {
    const authUrl = config.authUrl || DEFAULT_AUTH_URL;
    let appUrl = config.appUrl;
    let apiUrl = config.apiUrl;
    // If appUrl is already provided, skip discovery
    if (!appUrl) {
        try {
            const res = await fetch(`${authUrl}/api/client-apps/${config.clientId}/config`);
            if (res.ok) {
                const data = await res.json();
                appUrl = data.appUrl || undefined;
                if (!apiUrl)
                    apiUrl = data.apiUrl || undefined;
            }
        }
        catch {
            // Discovery failed — use fallback
        }
    }
    // Fallback to window.location.origin
    if (!appUrl && typeof window !== 'undefined') {
        appUrl = window.location.origin;
    }
    if (!appUrl) {
        appUrl = authUrl; // Last resort
    }
    return {
        clientId: config.clientId,
        authUrl,
        appUrl,
        apiUrl: apiUrl || appUrl,
    };
}
export const AUTH_INJECTION_KEY = Symbol('auth');
export const AUTH_CONFIG_KEY = Symbol('auth-config');
export const AUTH_RESOLVED_CONFIG_KEY = Symbol('auth-resolved-config');
export const AuthProvider = defineComponent({
    name: 'AuthProvider',
    props: {
        config: {
            type: Object,
            default: undefined,
        },
    },
    setup(props, { slots }) {
        // Read config from prop or from plugin injection
        const injectedConfig = inject(AUTH_CONFIG_KEY, undefined);
        const rawConfig = props.config || injectedConfig;
        if (!rawConfig) {
            throw new Error('AuthProvider requires a config prop or must be used with createAuthPlugin()');
        }
        const config = rawConfig;
        // Validate config on initialization (throws if invalid)
        validateConfig(config);
        // Resolve config synchronously if all URLs are provided, otherwise async
        const authUrlDefault = config.authUrl || DEFAULT_AUTH_URL;
        const resolved = ref(config.appUrl
            ? {
                clientId: config.clientId,
                authUrl: authUrlDefault,
                appUrl: config.appUrl,
                apiUrl: config.apiUrl || config.appUrl,
            }
            : null);
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
            appRole: null,
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
                appRole: payload.appRole || null,
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
            state.appRole = payload.appRole || null;
            state.accessToken = token;
            state.isAdmin = state.orgRole === 'admin' || state.orgRole === 'owner';
            state.isOwner = state.orgRole === 'owner';
            state.isAuthenticated = !!token && (config.requireOrg === false || !!state.organization);
            return payload;
        }
        async function refreshToken() {
            if (!resolved.value)
                return null;
            if (refreshLock)
                return null;
            refreshLock = true;
            try {
                const res = await fetch(`${resolved.value.apiUrl}/auth/refresh`, {
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
                    state.appRole = null;
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
            if (!resolved.value)
                return;
            try {
                const res = await fetch(`${resolved.value.authUrl}/api/organizations`, {
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
            if (!resolved.value)
                return;
            const redirectUri = `${resolved.value.appUrl}/auth/callback`;
            const loginState = btoa(JSON.stringify({ returnTo: window.location.pathname }));
            const params = new URLSearchParams({
                client_id: resolved.value.clientId,
                redirect_uri: redirectUri,
                state: loginState,
            });
            if (provider)
                params.set('provider', provider);
            window.location.href = `${resolved.value.authUrl}/authorize?${params}`;
        }
        async function logout() {
            if (!resolved.value)
                return;
            state.isLoggingOut = true;
            try {
                await fetch(`${resolved.value.apiUrl}/auth/logout`, {
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
            state.appRole = null;
            state.isSuperAdmin = false;
            state.isPlatformAdmin = false;
            state.isLoggingOut = false;
        }
        async function switchOrganization(orgId) {
            if (!resolved.value)
                return;
            try {
                const res = await fetch(`${resolved.value.apiUrl}/auth/switch-org`, {
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
        // Provide resolved config — use resolved value or placeholder during discovery
        const configValue = () => {
            if (resolved.value)
                return resolved.value;
            return {
                clientId: config.clientId,
                authUrl: config.authUrl || DEFAULT_AUTH_URL,
                appUrl: config.appUrl || '',
                apiUrl: config.apiUrl || config.appUrl || '',
            };
        };
        // We need to provide a reactive object, so use a reactive wrapper
        const resolvedConfigRef = reactive({
            get clientId() { return configValue().clientId; },
            get authUrl() { return configValue().authUrl; },
            get appUrl() { return configValue().appUrl; },
            get apiUrl() { return configValue().apiUrl; },
        });
        provide(AUTH_RESOLVED_CONFIG_KEY, resolvedConfigRef);
        onMounted(async () => {
            // Resolve config if not already resolved synchronously
            if (!resolved.value) {
                resolved.value = await resolveConfig(config);
            }
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
            app.component('AuthProvider', AuthProvider);
            app.provide(AUTH_CONFIG_KEY, config);
        },
    };
}
//# sourceMappingURL=AuthProvider.js.map