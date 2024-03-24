const { app, BrowserWindow, Menu, ipcMain, shell, Tray } = require('electron');
const path = require('path');
const notifier = require("node-notifier");
const fs = require("fs");
const { execSync } = require('child_process');

if (require('electron-squirrel-startup')) app.quit(); // Ne induljon el a program 2x telepítéskor

const filepath = __filename;
const windowsShellStartup = path.join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs", "Startup");

let silencedNotificationCycleCount = 0; // Hány ciklusig ne kapjon a felhasználó értesítéseket (/5s)
let isLiveWindowOpen = false;

// PearFound indítása bejelentkezésnél
// Parancsikon létrehozása shell:startup-ban
if (process.platform == "win32") { // Csak Windows-on hozza létre a parancsikont
    const builtfilepath = path.join(process.env.LOCALAPPDATA, "pearfound", "PearFound.exe");

    // Debug
    console.log(__filename);
    console.log(__dirname);

    if (!fs.existsSync(path.join(windowsShellStartup, "PearFound.symlink"))) {
        fs.symlink(builtfilepath, path.join(windowsShellStartup, "PearFound"), (err) => {
            if (err) {
                console.error('Parancsikon készítés hiba:', err);
                notifier.notify({
                    title: 'Sikertelen Automatikus Indítás',
                    message: 'Nem tudtunk létrehozni parancsikont. PearFound nem fog automatikusan elindulni. Próbáld meg a programot adminisztrátorként futtatni.',
                    timeout: 10,
                    icon: path.join(__dirname, 'pearoo.jpg')
                });
                return;
            }
            notifier.notify({
                title: 'Automatikus Indítás',
                message: 'Mostantól PearFound automatikusan el fog indulni minden bejelentkezésnél!',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
        });
    }
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
        icon: "pearoo.ico"
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
        icon: "pearoo.ico",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    ipcMain.on('open-pearoo-page', () => {
        console.log("Opening Pearoo's Page...");
        shell.openExternal("https://www.youtube.com/@Pearoo");
        notifier.notify({
            title: 'Stream értesítés elfogadva',
            message: '5 óráig nem fogsz értesítéseket kapni, a stream nézés meg nem zavarása érdekében.',
            timeout: 10,
            icon: path.join(__dirname, 'pearoo.jpg')
        });
        silencedNotificationCycleCount = 3600;
    });

    ipcMain.on('closednotif', () => {
        console.log("Notification was closed...");
        notifier.notify({
            title: 'Stream értesítés bezárva',
            message: '1 óráig nem fogsz értesítést kapni Pearoo élő adásáról. Ezt ki tudod kapcsolni a tálcaikonban.',
            timeout: 10,
            icon: path.join(__dirname, 'pearoo.jpg')
        });
        silencedNotificationCycleCount = 720;
    });

    isLiveWindowOpen = true;

    mainWindow.on("closed", () => {
        isLiveWindowOpen = false;
    });

    mainWindow.loadFile(path.join(__dirname, 'live.html'));
    // mainWindow.webContents.openDevTools(); // Debug
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// Windows tray menu
const trayMenu = Menu.buildFromTemplate([
    { type: 'separator' },
    {
        label: 'Értesítések letiltása 1 órára',
        click: () => {
            notifier.notify({
                title: 'Értesítések letiltva',
                message: '1 óráig nem fogsz stream értesítéseket kapni.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 720;
        }
    },
    {
        label: 'Értesítések letiltása 2 órára',
        click: () => {
            notifier.notify({
                title: 'Értesítések letiltva',
                message: '2 óráig nem fogsz stream értesítéseket kapni.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 1440;
        }
    },
    {
        label: 'Értesítések letiltása 5 órára',
        click: () => {
            notifier.notify({
                title: 'Értesítések letiltva',
                message: '5 óráig nem fogsz stream értesítéseket kapni.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 3600;
        }
    },
    {
        label: 'Értesítés-letiltás kikapcsolása',
        click: () => {
            notifier.notify({
                title: 'Értesítések engedélyezve :D',
                message: 'Újból kapni fogsz értesítéseket.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 0;
        }
    },
    { type: 'separator' },
    {
        label: 'Megnyitás: Pearoo YouTube csatornája',
        click: () => {
            shell.openExternal("https://www.youtube.com/@Pearoo");
        }
    },
    {
        label: 'Megnyitás: cablesalty YouTube csatornája',
        click: () => {
            shell.openExternal("https://www.youtube.com/@cablesalty");
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
        app.dock.hide(); // Elrejtés a dockból
    }
}).then(() => {
    // createWindow(); // Debug
    // createLiveWindow(); // Debug
    notifier.notify({
        title: 'PearFound a háttérben fut',
        message: 'Értesíteni fogunk, ha Pearoo streamet indít!',
        timeout: 10,
        icon: path.join(__dirname, 'pearoo.jpg')
    });
});



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    // Ne csináljon semmit
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
    if (!isLiveWindowOpen) {
        if (!silencedNotificationCycleCount > 0) {
            fetch("https://www.youtube.com/@Pearoo/streams").then(function (response) {
                return response.text();
            }).then(function (html) {
                if (html.includes("hqdefault_live.jpg")) {
                    createLiveWindow();
                }
            }).catch(function (err) {
                console.warn('Something went wrong', err);
            });
        } else {
            silencedNotificationCycleCount--;
        }
    }
}

setInterval(checkLiveStatus, 5000); // 5 másodpercenként checkolja hogy liveol e Pearoo