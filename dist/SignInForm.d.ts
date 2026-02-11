import { type PropType } from 'vue';
import { type SSOProvider } from './useProviders.js';
export declare const SignInForm: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** List of provider IDs to show (for manual control). Overrides autoFetch when provided. */
    providers: {
        type: PropType<SSOProvider[]>;
        default: undefined;
    };
    /** Whether to automatically fetch providers from the auth service. Defaults to true. */
    autoFetch: {
        type: BooleanConstructor;
        default: boolean;
    };
    class: {
        type: StringConstructor;
        default: undefined;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** List of provider IDs to show (for manual control). Overrides autoFetch when provided. */
    providers: {
        type: PropType<SSOProvider[]>;
        default: undefined;
    };
    /** Whether to automatically fetch providers from the auth service. Defaults to true. */
    autoFetch: {
        type: BooleanConstructor;
        default: boolean;
    };
    class: {
        type: StringConstructor;
        default: undefined;
    };
}>> & Readonly<{}>, {
    class: string;
    providers: SSOProvider[];
    autoFetch: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=SignInForm.d.ts.map