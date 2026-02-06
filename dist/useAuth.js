import { inject } from 'vue';
import { AUTH_INJECTION_KEY } from './AuthProvider.js';
export function useAuth() {
    const state = inject(AUTH_INJECTION_KEY);
    if (!state) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return state;
}
//# sourceMappingURL=useAuth.js.map