import isElectron from 'is-electron';

class SecureStorage {
    private isElectronApp: boolean;

    constructor() {
        this.isElectronApp = isElectron();
    }

    async getItem(key: string): Promise<string | null> {
        try {
            if (this.isElectronApp && window.electron?.storage) {
                console.log(`🔐 Getting item from Electron storage: ${key}`);
                const value = await window.electron.storage.get(key);
                console.log(`🔐 Retrieved from Electron storage: ${key} = ${value}`);
                return value;
            } else {
                console.log(`🔐 Getting item from localStorage: ${key}`);
                const value = localStorage.getItem(key);
                console.log(`🔐 Retrieved from localStorage: ${key} = ${value}`);
                return value;
            }
        } catch (error) {
            console.error(`❌ Error getting item ${key}:`, error);
            // Fallback to localStorage
            return localStorage.getItem(key);
        }
    }

    async setItem(key: string, value: string): Promise<boolean> {
        try {
            if (this.isElectronApp && window.electron?.storage) {
                console.log(`🔐 Setting item in Electron storage: ${key} = ${value}`);
                const success = await window.electron.storage.set(key, value);
                console.log(`🔐 Electron storage set result: ${success}`);
                return success;
            } else {
                console.log(`🔐 Setting item in localStorage: ${key} = ${value}`);
                localStorage.setItem(key, value);
                console.log(`🔐 localStorage set successful`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Error setting item ${key}:`, error);
            // Fallback to localStorage
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (fallbackError) {
                console.error(`❌ Fallback localStorage also failed:`, fallbackError);
                return false;
            }
        }
    }

    async removeItem(key: string): Promise<boolean> {
        try {
            if (this.isElectronApp && window.electron?.storage) {
                console.log(`🔐 Removing item from Electron storage: ${key}`);
                return await window.electron.storage.remove(key);
            } else {
                console.log(`🔐 Removing item from localStorage: ${key}`);
                localStorage.removeItem(key);
                return true;
            }
        } catch (error) {
            console.error(`❌ Error removing item ${key}:`, error);
            // Fallback to localStorage
            localStorage.removeItem(key);
            return true;
        }
    }

    async clear(): Promise<boolean> {
        try {
            if (this.isElectronApp && window.electron?.storage) {
                console.log(`🔐 Clearing Electron storage`);
                return await window.electron.storage.clear();
            } else {
                console.log(`🔐 Clearing localStorage`);
                localStorage.clear();
                return true;
            }
        } catch (error) {
            console.error(`❌ Error clearing storage:`, error);
            // Fallback to localStorage
            localStorage.clear();
            return true;
        }
    }

    // Synchronous methods for backward compatibility (only works with localStorage)
    getItemSync(key: string): string | null {
        if (this.isElectronApp) {
            console.warn(`⚠️ Synchronous getItem called in Electron - this will only work with localStorage fallback`);
        }
        return localStorage.getItem(key);
    }

    setItemSync(key: string, value: string): void {
        if (this.isElectronApp) {
            console.warn(`⚠️ Synchronous setItem called in Electron - this will only work with localStorage fallback`);
        }
        localStorage.setItem(key, value);
    }
}

// Export a singleton instance
export const secureStorage = new SecureStorage();

// Export the class for testing
export {SecureStorage};