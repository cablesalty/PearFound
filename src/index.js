// ===================================================
//     ___                 ___                     _  
//    / _ \___  __ _ _ __ / __\__  _   _ _ __   __| | 
//   / /_)/ _ \/ _` | '__/ _\/ _ \| | | | '_ \ / _` | 
//  / ___/  __/ (_| | | / / | (_) | |_| | | | | (_| | 
//  \/    \___|\__,_|_| \/   \___/ \__,_|_| |_|\__,_| 
//                                                    
// ===================================================
// PearFound weboldal:
//        https://cablesalty.github.io/PearFound
// ===================================================
// Author: Szabó Patrik (cablesalty)
// ===================================================


// ===================================================
// Importok/Requirements
// ===================================================
const { app, BrowserWindow, Menu, ipcMain, shell, Tray, dialog } = require('electron');
const path = require('path');
const notifier = require("node-notifier");
const fs = require("fs");
const axios = require('axios');

if (require('electron-squirrel-startup')) app.quit(); // Ne induljon el a program 2x telepítéskor

const currentVersion = "v1.2.0"; // Jelenlegi app verzió

let silencedNotificationCycleCount = 0; // Hány ciklusig ne kapjon a felhasználó értesítéseket (/5s)
let isLiveWindowOpen = false;


// ===================================================
// PearFound indítása bejelentkezésnél
// ---------------------------------------------------
// Symlink létrehozása shell:startup-ban
// WINDOWS ONLY (for now)
// ===================================================
if (process.platform == "win32") {

    // Pár constant Windows path ami szükséges a symlink létrehozásához
    const windowsShellStartup = path.join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
    const builtfilepath = path.join("C:", "Program Files (x86)", "PearFound", "PearFound.exe");

    // Csak akkor fusson le, ha le van buildelve az app
    if (__dirname.includes(".asar")) {

        // Check hogy látezik e már ez a symlink
        if (!fs.existsSync(path.join(windowsShellStartup, "PearFound"))) {

            // Symlink létrehozása
            fs.symlink(builtfilepath, path.join(windowsShellStartup, "PearFound"), (err) => {
                if (err) {
                    // HIBA: Sikertelen symlink létrehozás
                    // Felhasználó figyelmeztetése hogy gebasz van
                    console.error('Parancsikon készítés hiba:', err);
                    notifier.notify({
                        title: 'Sikertelen Automatikus Indítás',
                        message: 'Nem tudtunk létrehozni parancsikont. PearFound nem fog automatikusan elindulni. Próbáld meg a programot adminisztrátorként futtatni.',
                        timeout: 10,
                        icon: path.join(__dirname, 'pearoo.jpg')
                    });
                    return;
                }

                // Sikerült létrehozni a symlinket
                notifier.notify({
                    title: 'Automatikus Indítás',
                    message: 'Mostantól PearFound automatikusan el fog indulni minden bejelentkezésnél!',
                    timeout: 10,
                    icon: path.join(__dirname, 'pearoo.jpg')
                });
            });
        }
    }
}


// ===================================================
// LIVE FOUND ablak létrehozása
// ===================================================
const createLiveWindow = () => {
    // Ablak konfiguráció
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

    // IPC Event: Csatlakozás a livehoz
    ipcMain.on('open-pearoo-page', () => {

        // Pearoo YT csatornájának megnyitása
        console.log("Pearoo oldalának megnyitása...");
        shell.openExternal("https://www.youtube.com/@Pearoo");

        // Értesítés küldése
        notifier.notify({
            title: 'Stream értesítés elfogadva',
            message: '5 óráig nem fogsz értesítéseket kapni, a stream nézés meg nem zavarása érdekében.',
            timeout: 10,
            icon: path.join(__dirname, 'pearoo.jpg')
        });

        silencedNotificationCycleCount = 3600; // Értesítések némítása 5 óráig
    });

    // IPC Event: Értesítés bezárása
    ipcMain.on('closednotif', () => {
        console.log("Értesítés bezárva...");

        // Értesítés küldése
        notifier.notify({
            title: 'Stream értesítés bezárva',
            message: '1 óráig nem fogsz értesítést kapni Pearoo élő adásáról. Ezt ki tudod kapcsolni a tálcaikonban.',
            timeout: 10,
            icon: path.join(__dirname, 'pearoo.jpg')
        });

        silencedNotificationCycleCount = 720; // Értesítések némítása 1 óráig
    });

    isLiveWindowOpen = true;

    mainWindow.on("closed", () => {
        isLiveWindowOpen = false;
    });

    mainWindow.loadFile(path.join(__dirname, 'live.html')); // Fájl betöltése
    // mainWindow.webContents.openDevTools(); // Debug
};

// ===================================================
// Demo ablak
// ===================================================
const createLiveDemoWindow = () => {
    // Ablak konfiguráció
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

    // IPC Event: Csatlakozás a livehoz
    ipcMain.on('open-pearoo-page', () => {

        // Pearoo YT csatornájának megnyitása
        console.log("Pearoo oldalának megnyitása...");
        shell.openExternal("https://www.youtube.com/@Pearoo");

        // Értesítés küldése
        notifier.notify({
            title: 'Stream értesítés elfogadva',
            message: 'Ha csatlakozol az élő adáshoz, 5 óráig nem kapsz újra értesítést. Mivel ez csak egy demo, nem tiltottuk le az értesítéseket.',
            timeout: 10,
            icon: path.join(__dirname, 'pearoo.jpg')
        });
    });


    // IPC Event: Értesítés bezárása
    ipcMain.on('closednotif', () => {
        console.log("Értesítés bezárva...");

        // Értesítés küldése
        notifier.notify({
            title: 'Stream értesítés bezárva',
            message: 'Ha bezárod az értesítést, 1 óráig nem fogsz értesítést kapni. Mivel ez csak egy demo, nem tiltottuk le az értesítéseket.',
            timeout: 10,
            icon: path.join(__dirname, 'pearoo.jpg')
        });
    });

    isLiveWindowOpen = true;

    mainWindow.on("closed", () => {
        isLiveWindowOpen = false;
    });

    mainWindow.loadFile(path.join(__dirname, 'livedemo.html')); // Demo ablak betöltése
    // mainWindow.webContents.openDevTools(); // Debug
};


// ===================================================
// Tray menu
// ---------------------------------------------------
// Ez a menü kiosztás jelenik meg ha jobbkattintasz
// a Tray ikonra vagy macOS-en az app ikonra.
// ===================================================
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
        label: 'Demo értesítés indítása',
        click: () => {
            createLiveDemoWindow();
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

// ===================================================
// Ha készen áll az electron
// ===================================================
app.whenReady().then(() => {

    // Windows-on történő folyamatok
    if (process.platform == "win32") {

        // Windows Tray ikon hozzáadása
        tray = new Tray(path.join(__dirname, "pearoo.jpg"));
        tray.setToolTip('PearFound');
        tray.setContextMenu(trayMenu);

    // macOS-en történő folyamatok
    } else if (process.platform == "darwin") {

        // Dock menu használata
        app.dock.setMenu(trayMenu);
        app.dock.setIcon(path.join(__dirname, "pearoo-rounded.png"));

    }

    checkForNewRelease(); // Van e új verzió
}).then(() => {
    notifier.notify({
        title: 'PearFound a háttérben fut',
        message: 'Értesíteni fogunk, ha Pearoo streamet indít!',
        timeout: 10,
        icon: path.join(__dirname, 'pearoo.jpg')
    });
});


// ===================================================
// Ha minden ablak bezáródik
// ===================================================
app.on('window-all-closed', () => {
    // Ne csináljon semmit
    // Régen itt volt egy kód ami macOS-en bezárja az 
    // appot. Ez a menükiosztás miatt mostmár nem lép ki.
});

app.on('activate', () => {
    // Ne csináljon semmit
    // Nincs más felületünk a LIVE FOUND értesítésen kívül.
});


// ===================================================
// Van e új verzió
// ===================================================
const checkForNewRelease = async () => {
    try {
        const response = await axios.get(`https://api.github.com/repos/cablesalty/PearFound/releases/latest`);
        const latestReleaseTag = response.data.tag_name;
        
        // Jelenlegi verzió összehasonlítása a tag névvel
        if (currentVersion !== latestReleaseTag) {
            console.log('Új verzió elérhető:', latestReleaseTag);
            const newUpdateNotif = notifier.notify({
                title: 'Új verzió érhető el!',
                message: 'Kattints az értesítésre az új verzió letöltéséhez!',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });

            // Ha az értesítésre kattintanak
            newUpdateNotif.on('click', function() {
                // Legfrissebb verzió oldalának megnyitása
                console.log("Legfrissebb release oldalának megnyitása...");
                shell.openExternal("https://github.com/cablesalty/PearFound/releases/latest");
            });
        } else {
            console.log('Az alkalmazás friss és ropogós.');
        }
    } catch (error) {
        console.error('Hiba történt új verzió ellenőrzése közben:', error.response ? error.response.data : error.message);
        notifier.notify({
            title: 'Hiba történt új verzió ellenőrzése során',
            message: 'Nem tudtuk ellenőrizni, hogy elérhető e új PearFound verzió.',
            timeout: 10,
            icon: path.join(__dirname, 'pearoo.jpg')
        });
    }
};


// ===================================================
// Stream checkolása
// ---------------------------------------------------
// IMÁDLAK HAVER https://github.com/bogeta11040/if-youtube-channel-live
// EZ A SZAR MEGMENTETTE A SEGGEMET AZ API KULCSOK ÉS AZ OAUTH ELŐL
// ===================================================
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

// ===================================================
// 5mp-enként checkolja a stream státuszt
// ===================================================
setInterval(checkLiveStatus, 5000);