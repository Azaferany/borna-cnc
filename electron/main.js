import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { powerSaveBlocker } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({
        show: false,
        icon: path.join(__dirname, '../public/vite.ico'),
        webPreferences: {
            preload: path.join(__dirname, '../electron/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,

            allowRunningInsecureContent: true,
            enableBlinkFeatures: 'Serial',

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

app.whenReady().then(() => {
    //additional logic here
}).then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})