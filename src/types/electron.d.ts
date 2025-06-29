interface ElectronAPI {
    send: (channel: string, data: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    minimize: () => void;
    close: () => void;
    storage: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
        remove: (key: string) => Promise<boolean>;
        clear: () => Promise<boolean>;
    };
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

export {}; 