declare namespace JSX {
    interface IntrinsicElements {
        body: Record<string, unknown>;
        h1: Record<string, unknown>;
    }
}

declare module "react/jsx-runtime" {
    export const Fragment: unique symbol;
    export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
    export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
}

declare module "react-dom/server" {
    export interface RenderToReadableStreamOptions {
        bootstrapScriptContent?: string;
        bootstrapScripts?: string[];
        signal?: AbortSignal;
    }

    export function renderToReadableStream(
        children: unknown,
        options?: RenderToReadableStreamOptions,
    ): Promise<ReadableStream>;
}
