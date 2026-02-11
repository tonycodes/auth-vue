import { inject } from 'vue';
import { AUTH_INJECTION_KEY, AUTH_RESOLVED_CONFIG_KEY } from './AuthProvider.js';
export function useAuth() {
    const state = inject(AUTH_INJECTION_KEY);
    if (!state) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return state;
}
export function useAuthConfig() {
    const config = inject(AUTH_RESOLVED_CONFIG_KEY);
    if (!config) {
        throw new Error('useAuthConfig must be used within an AuthProvider');
    }
    return config;
}
//# sourceMappingURL=useAuth.js.map