/**
 * Configuration validation errors for better developer experience.
 */
export class AuthConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthConfigError';
    }
}
/**
 * Validates AuthConfig and throws descriptive errors if invalid.
 * Called at initialization time to fail fast with helpful messages.
 * Only clientId is required — authUrl and appUrl can be auto-discovered.
 */
export function validateConfig(config) {
    if (!config) {
        throw new AuthConfigError('AuthProvider requires a config prop. ' +
            'At minimum, provide { clientId: "your-app-id" }.');
    }
    // Required field
    if (!config.clientId) {
        throw new AuthConfigError('Missing required config: clientId. ' +
            'This is the client ID registered with the auth service.');
    }
    // URL format validation (only if provided)
    if (config.authUrl) {
        try {
            new URL(config.authUrl);
        }
        catch {
            throw new AuthConfigError(`Invalid authUrl: "${config.authUrl}" is not a valid URL. ` +
                'It should include the protocol (e.g., "https://auth.tony.codes").');
        }
    }
    if (config.appUrl) {
        try {
            new URL(config.appUrl);
        }
        catch {
            throw new AuthConfigError(`Invalid appUrl: "${config.appUrl}" is not a valid URL. ` +
                'It should include the protocol (e.g., "https://myapp.tony.codes").');
        }
    }
    if (config.apiUrl) {
        try {
            new URL(config.apiUrl);
        }
        catch {
            throw new AuthConfigError(`Invalid apiUrl: "${config.apiUrl}" is not a valid URL. ` +
                'It should include the protocol (e.g., "https://api.myapp.tony.codes").');
        }
    }
    // Common misconfiguration warnings (logged but don't throw)
    if (typeof window !== 'undefined') {
        const isProduction = !window.location.hostname.includes('test') &&
            !window.location.hostname.includes('localhost');
        if (isProduction && config.authUrl?.includes('localhost')) {
            console.warn('[auth-vue] Warning: authUrl contains "localhost" but app appears to be in production. ' +
                'Make sure to update authUrl for production.');
        }
        if (config.authUrl?.endsWith('/')) {
            console.warn('[auth-vue] Warning: authUrl has a trailing slash. ' +
                'This may cause double slashes in URLs.');
        }
        if (config.appUrl?.endsWith('/')) {
            console.warn('[auth-vue] Warning: appUrl has a trailing slash. ' +
                'This may cause double slashes in URLs.');
        }
    }
}
//# sourceMappingURL=validateConfig.js.map