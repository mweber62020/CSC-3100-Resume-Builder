// NOT IN USE AT THIS TIME - DIDNT WORK THE WAY I EXPECTED

// ============================================================
// electron.js - Electron main process
// Starts the Express server and opens a desktop app window.
// ============================================================

const { app, BrowserWindow } = require('electron');
const net = require('net');
const path = require('path');

// Start the Express server
require('./server.js');

const intPort = process.env.PORT || 3000;

// ------------------------------------------------------------
// waitForServer()
// Waits until the server is open before continuing.
// ------------------------------------------------------------
function waitForServer() {
    return new Promise((resolve) => {
        function tryConnect() {
            const objSocket = net.createConnection({ port: intPort }, () => {
                objSocket.destroy();
                resolve(); // Server is ready
            });
            objSocket.on('error', () => {
                setTimeout(tryConnect, 200); // Not ready yet
            });
        }
        tryConnect();
    });
}

// ------------------------------------------------------------
// createWindow()
// Creates the main app window and loads the local server URL.
// ------------------------------------------------------------
function createWindow() {
    const objWin = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'img', 'favicon-32x32.png'), // icon
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    objWin.loadURL(`http://localhost:${intPort}`);
}

// Wait for Express to be ready, then open the window
app.whenReady().then(async () => {
    await waitForServer();
    createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
