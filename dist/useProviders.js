import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthConfig } from './useAuth.js';
const CACHE_TTL = 60000; // 60 seconds
const cache = new Map();
function getCacheKey(authUrl, clientId) {
    return `${authUrl}::${clientId}`;
}
function getCachedProviders(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    return entry;
}
function isStale(entry) {
    return Date.now() - entry.fetchedAt > CACHE_TTL;
}
async function fetchProviders(authUrl, clientId) {
    const url = new URL(`${authUrl}/providers`);
    url.searchParams.set('client_id', clientId);
    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error('Failed to fetch providers');
    }
    const data = await res.json();
    return { providers: data.providers || [], emailEnabled: !!data.emailEnabled };
}
// ─── Composable ──────────────────────────────────────────────────────────
/**
 * Composable to fetch available SSO providers from the auth service.
 * Uses module-level cache with 60s TTL and stale-while-revalidate.
 * Clears cache on window.focus for admin changes to take effect.
 */
export function useProviders() {
    const config = useAuthConfig();
    const cacheKey = getCacheKey(config.authUrl, config.clientId);
    // Initialize from cache if available
    const cached = getCachedProviders(cacheKey);
    const providers = ref(cached?.providers || []);
    const emailEnabled = ref(cached?.emailEnabled || false);
    const isLoading = ref(!cached);
    const error = ref(null);
    let mounted = true;
    async function doFetch(showLoading) {
        if (showLoading)
            isLoading.value = true;
        try {
            const result = await fetchProviders(config.authUrl, config.clientId);
            cache.set(cacheKey, { providers: result.providers, emailEnabled: result.emailEnabled, fetchedAt: Date.now() });
            if (mounted) {
                providers.value = result.providers;
                emailEnabled.value = result.emailEnabled;
                error.value = null;
            }
        }
        catch (err) {
            if (mounted) {
                error.value = err instanceof Error ? err.message : 'Failed to fetch providers';
                // Keep stale data if we have it
                if (!cached)
                    providers.value = [];
            }
        }
        finally {
            if (mounted)
                isLoading.value = false;
        }
    }
    function refresh() {
        cache.delete(cacheKey);
        doFetch(true);
    }
    function handleFocus() {
        const current = getCachedProviders(cacheKey);
        if (!current || isStale(current)) {
            doFetch(false);
        }
    }
    onMounted(() => {
        const entry = getCachedProviders(cacheKey);
        if (!entry) {
            // No cache — fetch with loading state
            doFetch(true);
        }
        else if (isStale(entry)) {
            // Stale cache — show cached data, refresh in background
            providers.value = entry.providers;
            emailEnabled.value = entry.emailEnabled;
            isLoading.value = false;
            doFetch(false);
        }
        else {
            // Fresh cache — use it directly
            providers.value = entry.providers;
            emailEnabled.value = entry.emailEnabled;
            isLoading.value = false;
        }
        // Refetch on window focus (admin changes take effect when tab refocused)
        window.addEventListener('focus', handleFocus);
    });
    onUnmounted(() => {
        mounted = false;
        window.removeEventListener('focus', handleFocus);
    });
    return { providers, emailEnabled, isLoading, error, refresh };
}
//# sourceMappingURL=useProviders.js.map