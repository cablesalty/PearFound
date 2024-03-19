const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const filepath = path.join(__dirname, __filename);

// PearFound indítása bejelentkezésnél
if (process.platform == "win32") {
    const Service = require('node-windows').Service;
    var svc = new Service({
        name: 'PearFound',
        description: 'Értesít, ha Pearoo liveol.',
        script: filepath
    });
    svc.on('install', function () {
        svc.start();
    });
    svc.install();
}

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
        app.setName("PearFound");
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


// IMÁDLAK HAVER https://github.com/bogeta11040/if-youtube-channel-live
// EZ A SZAR MEGMENTETTE A SEGGEMET AZ API KULCSOK ÉS AZ OAUTH ELŐL
async function checkLiveStatus() {
    fetch("https://www.youtube.com/@Pearoo/streams").then(function (response) {
        return response.text();
    }).then(function (html) {
        if (html.includes("hqdefault_live.jpg")) {
            createLiveWindow();
        }
    }).catch(function (err) {
        console.warn('Something went wrong', err);
    });
}

setInterval(checkLiveStatus, 5000); // 5 másodpercenként checkolja hogy liveol e Pearoo