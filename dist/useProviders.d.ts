import { ref } from 'vue';
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
export declare function useProviders(): {
    providers: import("vue").Ref<{
        id: string;
        name: string;
        enabled: boolean;
    }[], ProviderInfo[] | {
        id: string;
        name: string;
        enabled: boolean;
    }[]>;
    isLoading: import("vue").Ref<boolean, boolean>;
    error: import("vue").Ref<string | null, string | null>;
};
//# sourceMappingURL=useProviders.d.ts.map