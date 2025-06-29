// This utility helps debug localStorage location in Electron
export const getElectronStorageInfo = () => {
    // Detect if we're running in Electron
    const isElectron = typeof window !== 'undefined' &&
        typeof window.process === 'object' &&
        (window.process as any)?.type === 'renderer'

    return {
        isElectron,
        userDataPath: isElectron ? 'Available in main process only' : 'Not in Electron',
        storageLocation: isElectron ? 'Electron app data directory' : 'Browser localStorage',
        debugging: {
            checkLocalStorage: () => {
                try {
                    const testKey = 'electron-storage-test'
                    const testValue = `test-${Date.now()}`

                    // Test write
                    localStorage.setItem(testKey, testValue)

                    // Test read
                    const retrieved = localStorage.getItem(testKey)

                    // Clean up
                    localStorage.removeItem(testKey)

                    console.log('✅ localStorage test successful:', {
                        written: testValue,
                        retrieved,
                        match: testValue === retrieved
                    })

                    return testValue === retrieved
                } catch (error) {
                    console.error('❌ localStorage test failed:', error)
                    return false
                }
            },
            showAllKeys: () => {
                const keys = Object.keys(localStorage)
                console.log('📋 All localStorage keys:', keys)
                keys.forEach(key => {
                    console.log(`  ${key}: ${localStorage.getItem(key)}`)
                })
                return keys
            }
        }
    }
}

// Auto-run storage test in development
if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
        const info = getElectronStorageInfo()
        console.log('🔍 Electron Storage Info:', info)

        // Run localStorage test
        info.debugging.checkLocalStorage()

        // Show current language storage
        const currentLang = localStorage.getItem('i18nextLng')
        console.log('🌐 Current language in storage:', currentLang)
    }, 1000)
} 