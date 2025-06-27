interface ElectronAPI {
    send: (channel: string, data: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    minimize: () => void;
    close: () => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export {}; 