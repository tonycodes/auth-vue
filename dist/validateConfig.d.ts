import type { AuthConfig } from './types.js';
/**
 * Configuration validation errors for better developer experience.
 */
export declare class AuthConfigError extends Error {
    constructor(message: string);
}
/**
 * Validates AuthConfig and throws descriptive errors if invalid.
 * Called at initialization time to fail fast with helpful messages.
 * Only clientId is required — authUrl and appUrl can be auto-discovered.
 */
export declare function validateConfig(config: AuthConfig): void;
//# sourceMappingURL=validateConfig.d.ts.map