import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { powerSaveBlocker } from 'electron';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Storage functionality
const getStoragePath = () => {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'app-storage.json');
};

const readStorage = () => {
    try {
        const storagePath = getStoragePath();
        if (fs.existsSync(storagePath)) {
            const data = fs.readFileSync(storagePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading storage:', error);
    }
    return {};
};

const writeStorage = (data) => {
    try {
        const storagePath = getStoragePath();
        const dir = path.dirname(storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing storage:', error);
        return false;
    }
};

// IPC handlers for storage
ipcMain.handle('storage-get', (event, key) => {
    const storage = readStorage();
    return storage[key] || null;
});

ipcMain.handle('storage-set', (event, key, value) => {
    const storage = readStorage();
    storage[key] = value;
    return writeStorage(storage);
});

ipcMain.handle('storage-remove', (event, key) => {
    const storage = readStorage();
    delete storage[key];
    return writeStorage(storage);
});

ipcMain.handle('storage-clear', () => {
    return writeStorage({});
});

function createWindow () {
    mainWindow = new BrowserWindow({
        show: false,
        icon: path.join(__dirname, '../public/vite.ico'),
        frame: false, // Remove the default window frame
        fullscreen: true, // Hide the title bar
        webPreferences: {
            preload: path.join(__dirname, '../electron/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            enableBlinkFeatures: 'Serial',
            webSecurity: true, // Re-enable web security for better localStorage behavior
            allowRunningInsecureContent: false, // More secure
            // Add session partition for proper storage isolation
            partition: 'persist:main',
            // Allow WebSocket connections to local network
            experimentalFeatures: true
        },
    });
    mainWindow.maximize();
    mainWindow.show();

    powerSaveBlocker.start('prevent-app-suspension');
    powerSaveBlocker.start('prevent-display-sleep');

    mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
        // Add listeners to handle ports being added or removed before the callback for `select-serial-port`
        // is called.
        mainWindow.webContents.session.on('serial-port-added', (event, port) => {
            console.log('serial-port-added FIRED WITH', port)
            // Optionally update portList to add the new port
        })

        mainWindow.webContents.session.on('serial-port-removed', (event, port) => {
            console.log('serial-port-removed FIRED WITH', port)
            // Optionally update portList to remove the port
        })
        event.preventDefault()
        if (portList && portList.length > 0) {
            callback(portList[0].portId)
        } else {
            callback('') // Could not find any matching devices
        }
    })
    mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
        return permission === 'serial';

    })

    mainWindow.webContents.session.setDevicePermissionHandler((details) => {
        return details.deviceType === 'serial';


    })

    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173'); // Assuming Vite's default port
        mainWindow.setMenuBarVisibility(false)
        mainWindow.webContents.openDevTools(); // this is optional thing, use it if you see a devTool window opened

    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        mainWindow.setMenuBarVisibility(false)

    }
}

// IPC handlers for window controls
ipcMain.on('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

app.whenReady().then(() => {
    //additional logic here
}).then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})