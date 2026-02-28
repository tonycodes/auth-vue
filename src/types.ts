export interface AuthConfig {
  /** Client ID registered with auth service */
  clientId: string;
  /** Auth service URL. Defaults to https://auth.tony.codes */
  authUrl?: string;
  /** This app's base URL. Auto-discovered from server or defaults to window.location.origin */
  appUrl?: string;
  /**
   * API base URL for proxied auth endpoints (callback, refresh, logout).
   * Required if your API runs on a different subdomain than your frontend
   * (e.g., api.myapp.test vs myapp.test).
   * Auto-discovered from server or defaults to appUrl.
   */
  apiUrl?: string;
  /**
   * Whether to require an organization for the user to be considered authenticated.
   * Defaults to true. Set to false for single-user apps without org context.
   */
  requireOrg?: boolean;
}

/** Resolved config with all URLs populated (after discovery) */
export interface ResolvedAuthConfig {
  clientId: string;
  authUrl: string;
  appUrl: string;
  apiUrl: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  imageUrl: string | null;
  appRole: string | null;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  organization: AuthOrganization | null;
  tenant: { id: string; name: string; slug: string } | null; // legacy alias
  isAdmin: boolean;
  isOwner: boolean;
  orgRole: string;
  appRole: string | null;
  isSuperAdmin: boolean;
  isPlatformAdmin: boolean;
  accessToken: string | null;
  getAccessToken: () => Promise<string | null>;
  /** Refresh auth state from server (call after token exchange to sync in-memory state) */
  refreshSession: () => Promise<string | null>;
  login: (provider?: string) => void;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  organizations: AuthOrganization[];
  isLoggingOut: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  impersonating: boolean;
}
