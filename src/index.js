const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const axios = require('axios');

const channelID = "UCsBw4YIB40Zpiw4yVIqxtbg"; // Pearoo YT csatorna ID-ja

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        resizable: false,
        width: 1000,
        height: 650,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();
};

const createLiveWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        resizable: false,
        width: 1000,
        height: 650,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'live.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// macOS Dock menu
const dockMenu = Menu.buildFromTemplate([
    {
        label: 'Információ',
        click() { 
            createWindow();
         }
    }
]);

// Windows tray menu
const trayMenu = Menu.buildFromTemplate([
    { type: 'separator' },
    {
        label: 'Információ',
        click: () => {
            createWindow();
        }
    },
    { type: 'separator' },
    {
        label: 'PearFound Bezárása',
        click: () => {
            app.quit();
            process.exit(0);
        }
    }
]);

app.whenReady().then(() => {
    if (process.platform == "win32") {
        // Windows Tray ikon hozzáadása
        tray = new Tray(path.join(__dirname, "pearoo.jpg"));
        tray.setToolTip('PearFound');
        tray.setContextMenu(trayMenu);
    } else if (process.platform == "darwin") {
        app.dock.setMenu(dockMenu); // macOS Dock parancsok hozzáadása
    }
}).then(() => {
    createWindow();
    // createLiveWindow(); // Debug
});



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


async function checkLiveStatus() {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelID}&eventType=live&type=video`);
        
        const isLive = response.data.items.length > 0;
        
        if (isLive) {
            console.log('Pearoo Liveol!!4! (100% veszély)');
            
        }
    } catch (error) {
        console.error('Hiba történt ellenörzéskor: ', error.message);
    }
}

setInterval(checkLiveStatus, 5000); // 5 másodpercenként checkolja hogy liveol e Pearoo