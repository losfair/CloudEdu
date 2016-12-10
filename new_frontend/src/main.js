const {app, BrowserWindow, ipcMain} = require("electron");
const url = require("url");
const path = require("path");

const appPaths = {
    "AlphaBoard": "BrowserView/AlphaBoard/index.html"
};

let browserWindow = null;
let appWindows = {};

function openAppWindow(appName) {
    let appPath = null;

    try {
        appPath = appPaths[appName];
    } catch (e) {
        appPath = null;
    }

    if (!appPath) return;
    if (appWindows[appName]) return;

    appWindows[appName] = new BrowserWindow({
        "width": 0,
        "height": 0,
        "show": false
    });
    appWindows[appName].loadURL(url.format({
        "pathname": path.join(__dirname, appPath),
        "protocol": "file:",
        "slashes": true
    }));
    appWindows[appName].on("closed", () => {
        appWindows[appName] = null;
    })
    appWindows[appName].webContents.on('did-finish-load', function () {
        setTimeout(() => {
            appWindows[appName].show();
            appWindows[appName].setFullScreen(true);
        }, 100);
    });
}

function initWindow() {
    browserWindow = new BrowserWindow({
        "width": 0,
        "height": 0,
        "show": false
    });
    browserWindow.loadURL(url.format({
        "pathname": path.join(__dirname, "BrowserView/index.html"),
        "protocol": "file:",
        "slashes": true
    }));
    browserWindow.on("closed", () => {
        browserWindow = null;
    })
    browserWindow.webContents.on('did-finish-load', function () {
        setTimeout(() => {
            browserWindow.show();
            browserWindow.setFullScreen(true);
        }, 100);
    });
}

app.on("ready", initWindow);
app.on("window-all-closed", () => {
    app.quit();
});

ipcMain.on("synchronous-message", (event, arg) => {
    try {
        var actionType = arg.actionType;
    } catch (e) {
        var actionType = null;
    }
    if (!actionType) {
        event.returnValue = "Unknown action type";
        return;
    }
    if (actionType == "openApp") {
        try {
            var appName = arg.appName;
        } catch (e) {
            var appName = null;
        }
        if (!appName || !appPaths[appName]) {
            event.returnValue = "Invalid app name";
            return;
        }
        openAppWindow(appName);
        event.returnValue = "OK";
        return;
    } else {
        event.returnValue = "Unknown action type";
        return;
    }
})
