import { type PropType } from 'vue';
type Mode = 'signin' | 'signup';
export declare const SignInForm: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** List of provider IDs to show. If not provided, auto-fetches from auth service. */
    providers: {
        type: PropType<string[]>;
        default: undefined;
    };
    /** Whether to auto-fetch available providers from the auth service. Default: true */
    autoFetch: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Mode to display the form in */
    mode: {
        type: PropType<Mode>;
        default: undefined;
    };
    class: {
        type: StringConstructor;
        default: undefined;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** List of provider IDs to show. If not provided, auto-fetches from auth service. */
    providers: {
        type: PropType<string[]>;
        default: undefined;
    };
    /** Whether to auto-fetch available providers from the auth service. Default: true */
    autoFetch: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Mode to display the form in */
    mode: {
        type: PropType<Mode>;
        default: undefined;
    };
    class: {
        type: StringConstructor;
        default: undefined;
    };
}>> & Readonly<{}>, {
    mode: Mode;
    class: string;
    providers: string[];
    autoFetch: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export {};
//# sourceMappingURL=SignInForm.d.ts.map