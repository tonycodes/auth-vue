import { type InjectionKey, type PropType } from 'vue';
import type { AuthConfig, AuthState } from './types.js';
export declare const AUTH_INJECTION_KEY: InjectionKey<AuthState>;
export declare const AUTH_CONFIG_KEY: InjectionKey<AuthConfig>;
export declare const AuthProvider: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    config: {
        type: PropType<AuthConfig>;
        default: undefined;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>[] | undefined, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    config: {
        type: PropType<AuthConfig>;
        default: undefined;
    };
}>> & Readonly<{}>, {
    config: AuthConfig;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
/** Vue plugin factory for convenient app.use() installation */
export declare function createAuthPlugin(config: AuthConfig): {
    install(app: {
        component: (name: string, comp: unknown) => void;
        provide: (key: symbol | InjectionKey<unknown>, value: unknown) => void;
    }): void;
};
//# sourceMappingURL=AuthProvider.d.ts.map