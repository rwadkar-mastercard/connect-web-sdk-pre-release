export interface ConnectEventHandlers {
    onDone: (event: ConnectDoneEvent) => void;
    onCancel: (event: ConnectCancelEvent) => void;
    onError: (event: ConnectErrorEvent) => void;
    onRoute?: (event: ConnectRouteEvent) => void;
    onUser?: (event: any) => void;
    onLoad?: () => void;
}
export interface ConnectProps {
    connectUrl: string;
    eventHandlers: ConnectEventHandlers;
    linkingUri?: string;
}
export interface ConnectCancelEvent {
    code: number;
    reason: string;
}
export interface ConnectErrorEvent {
    code: number;
    reason: string;
}
export interface ConnectDoneEvent {
    code: number;
    reason: string;
    reportData: [
        {
            portfolioId: string;
            type: string;
            reportId: string;
        }
    ];
}
export interface ConnectRouteEvent {
    screen: string;
    params: any;
}
export interface ConnectOptions {
    selector?: string;
    node?: Node;
    overlay?: string;
    popup?: boolean;
    popupOptions?: PopupOptions;
    redirectUrl?: string;
}
export interface PopupOptions {
    width?: number;
    height?: number;
    top?: number;
    left?: number;
}
interface Connect {
    destroy: () => void;
    launch: (url: string, eventHandlers: ConnectEventHandlers, options?: ConnectOptions) => Window | null | void;
    initPostMessage: (options: ConnectOptions) => void;
    openPopupWindow: (url: string) => void;
    postMessage: (event: any) => void;
}
export declare const Connect: Connect;
export {};
