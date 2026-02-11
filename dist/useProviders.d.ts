import { type Ref } from 'vue';
export type SSOProvider = 'github' | 'google' | 'apple' | 'bitbucket';
export interface ProviderInfo {
    id: SSOProvider;
    name: string;
    enabled: boolean;
}
export interface UseProvidersResult {
    providers: Ref<ProviderInfo[]>;
    isLoading: Ref<boolean>;
    error: Ref<string | null>;
    /** Force refetch, bypassing cache */
    refresh: () => void;
}
/**
 * Composable to fetch available SSO providers from the auth service.
 * Uses module-level cache with 60s TTL and stale-while-revalidate.
 * Clears cache on window.focus for admin changes to take effect.
 */
export declare function useProviders(): UseProvidersResult;
//# sourceMappingURL=useProviders.d.ts.map