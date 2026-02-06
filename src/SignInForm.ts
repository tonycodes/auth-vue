import { defineComponent, ref, computed, onMounted, inject, h, type PropType } from 'vue';
import { AUTH_CONFIG_KEY } from './AuthProvider.js';
import { useProviders } from './useProviders.js';
import type { AuthConfig } from './types.js';

type Mode = 'signin' | 'signup';

const ERROR_MESSAGES: Record<string, string> = {
  account_not_found: 'No account found with that login. Sign up to create one.',
  oauth_failed: 'Something went wrong during sign in. Please try again.',
  missing_code: 'Authorization failed. Please try again.',
  invalid_state: 'Session expired. Please try again.',
};

const GITHUB_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`;

const GOOGLE_ICON = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;

const APPLE_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>`;

const BITBUCKET_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/></svg>`;

export const SignInForm = defineComponent({
  name: 'SignInForm',
  props: {
    /** List of provider IDs to show. If not provided, auto-fetches from auth service. */
    providers: {
      type: Array as PropType<string[]>,
      default: undefined,
    },
    /** Whether to auto-fetch available providers from the auth service. Default: true */
    autoFetch: {
      type: Boolean,
      default: true,
    },
    /** Mode to display the form in */
    mode: {
      type: String as PropType<Mode>,
      default: undefined,
    },
    class: {
      type: String,
      default: undefined,
    },
  },
  setup(props) {
    const config = inject<AuthConfig>(AUTH_CONFIG_KEY, undefined as unknown as AuthConfig);
    const { providers: fetchedProviders, isLoading: providersLoading } = useProviders();

    const activeTab = ref<Mode>(props.mode || 'signin');
    const errorMessage = ref<string | null>(null);
    const returnTo = ref('/');

    // Determine which providers to show
    const enabledProviderIds = computed(() => {
      if (props.providers) {
        return props.providers;
      }
      if (props.autoFetch) {
        return fetchedProviders.value.filter((p) => p.enabled).map((p) => p.id);
      }
      return ['github'];
    });

    const showLoading = computed(() => {
      return props.autoFetch && providersLoading.value && !props.providers;
    });

    onMounted(() => {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');
      const tabParam = params.get('tab') as Mode | null;
      const returnToParam = params.get('returnTo');

      if (returnToParam) returnTo.value = returnToParam;

      if (errorParam) {
        errorMessage.value = ERROR_MESSAGES[errorParam] || `Authentication error: ${errorParam}`;
        if (errorParam === 'account_not_found') {
          activeTab.value = 'signup';
        }
      }

      if (!props.mode && (tabParam === 'signin' || tabParam === 'signup')) {
        activeTab.value = tabParam;
      }
    });

    function handleOAuth(provider: string) {
      if (!config) return;

      const redirectUri = `${config.appUrl}/auth/callback`;
      const state = btoa(JSON.stringify({ returnTo: returnTo.value }));
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        state,
        provider,
        mode: activeTab.value,
      });
      window.location.href = `${config.authUrl}/authorize?${params}`;
    }

    function switchTab(tab: Mode) {
      activeTab.value = tab;
      errorMessage.value = null;
    }

    function getProviderButton(providerId: string) {
      const actionText = activeTab.value === 'signin' ? 'Sign in with' : 'Sign up with';

      const buttonConfigs: Record<string, { icon: string; class: string; label: string }> = {
        github: {
          icon: GITHUB_ICON,
          class: 'w-full flex items-center justify-center gap-3 px-6 py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer',
          label: `${actionText} GitHub`,
        },
        google: {
          icon: GOOGLE_ICON,
          class: 'w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-zinc-700 font-medium rounded-xl border border-zinc-300 hover:bg-zinc-50 transition-colors cursor-pointer',
          label: `${actionText} Google`,
        },
        apple: {
          icon: APPLE_ICON,
          class: 'w-full flex items-center justify-center gap-3 px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer',
          label: `${actionText} Apple`,
        },
        bitbucket: {
          icon: BITBUCKET_ICON,
          class: 'w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer',
          label: `${actionText} Bitbucket`,
        },
      };

      const config = buttonConfigs[providerId];
      if (!config) return null;

      return h('button', {
        key: providerId,
        type: 'button',
        class: config.class,
        onClick: () => handleOAuth(providerId),
      }, [
        h('span', { innerHTML: config.icon }),
        h('span', null, config.label),
      ]);
    }

    return () => {
      const tabStyle = (tab: Mode) => {
        const isActive = activeTab.value === tab;
        return [
          'flex-1 py-2 text-sm font-medium rounded-lg text-center cursor-pointer transition-colors',
          isActive
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700',
        ].join(' ');
      };

      const children = [];

      // Tab toggle
      children.push(
        h('div', { class: 'flex gap-1 p-1 bg-zinc-100 rounded-xl mb-6' }, [
          h('button', {
            type: 'button',
            class: tabStyle('signin'),
            onClick: () => switchTab('signin'),
          }, 'Sign In'),
          h('button', {
            type: 'button',
            class: tabStyle('signup'),
            onClick: () => switchTab('signup'),
          }, 'Sign Up'),
        ])
      );

      // Error message
      if (errorMessage.value) {
        children.push(
          h('div', {
            class: 'mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm',
          }, errorMessage.value)
        );
      }

      // Provider buttons or loading
      if (showLoading.value) {
        children.push(
          h('div', {
            class: 'text-center py-4 text-zinc-500 text-sm',
          }, 'Loading providers...')
        );
      } else {
        children.push(
          h('div', { class: 'space-y-3' },
            enabledProviderIds.value.map((id) => getProviderButton(id)).filter(Boolean)
          )
        );
      }

      // Terms
      children.push(
        h('p', {
          class: 'mt-6 text-center text-xs text-zinc-400',
        }, 'By continuing, you agree to our terms of service.')
      );

      return h('div', { class: props.class || '' }, children);
    };
  },
});
