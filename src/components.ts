import { defineComponent, h } from 'vue';
import { useAuth } from './useAuth.js';

/**
 * Renders slot content only when user is authenticated
 */
export const SignedIn = defineComponent({
  name: 'SignedIn',
  setup(_, { slots }) {
    const auth = useAuth();
    return () => {
      if (auth.isLoading || !auth.isAuthenticated) return null;
      return slots.default?.();
    };
  },
});

/**
 * Renders slot content only when user is NOT authenticated
 */
export const SignedOut = defineComponent({
  name: 'SignedOut',
  setup(_, { slots }) {
    const auth = useAuth();
    return () => {
      if (auth.isLoading || auth.isAuthenticated) return null;
      return slots.default?.();
    };
  },
});

/**
 * Redirects to auth service sign-in when user is not authenticated
 */
export const RedirectToSignIn = defineComponent({
  name: 'RedirectToSignIn',
  setup() {
    const auth = useAuth();
    return () => {
      if (auth.isLoading) return null;
      if (!auth.isAuthenticated) {
        auth.login();
        return null;
      }
      return null;
    };
  },
});
