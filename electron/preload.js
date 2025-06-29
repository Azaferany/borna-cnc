const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) =>
        ipcRenderer.on(channel, (event, ...args) => func(...args)),
    minimize: () => ipcRenderer.send('minimize-window'),
    close: () => ipcRenderer.send('close-window'),

    // Secure storage methods
    storage: {
        get: (key) => ipcRenderer.invoke('storage-get', key),
        set: (key, value) => ipcRenderer.invoke('storage-set', key, value),
        remove: (key) => ipcRenderer.invoke('storage-remove', key),
        clear: () => ipcRenderer.invoke('storage-clear')
    }
});