/**
 * Component that handles the OAuth callback.
 * Mount at /auth/callback route.
 *
 * Exchanges the authorization code for tokens via the backend proxy,
 * then redirects to the original page.
 */
export declare const AuthCallback: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    apiUrl: {
        type: StringConstructor;
        default: undefined;
    };
    onSuccess: {
        type: FunctionConstructor;
        default: undefined;
    };
    onError: {
        type: FunctionConstructor;
        default: undefined;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    apiUrl: {
        type: StringConstructor;
        default: undefined;
    };
    onSuccess: {
        type: FunctionConstructor;
        default: undefined;
    };
    onError: {
        type: FunctionConstructor;
        default: undefined;
    };
}>> & Readonly<{}>, {
    apiUrl: string;
    onSuccess: Function;
    onError: Function;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=AuthCallback.d.ts.map