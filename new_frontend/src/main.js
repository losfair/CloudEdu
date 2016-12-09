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
    } catch(e) {
        appPath = null;
    }

    if(!appPath) return;
    if(appWindows[appName]) return;

    appWindows[appName] = new BrowserWindow({
        "width": 800,
        "height": 600
    });
    appWindows[appName].setFullScreen(true);
    appWindows[appName].loadURL(url.format({
        "pathname": path.join(__dirname, appPath),
        "protocol": "file:",
        "slashes": true
    }));
    appWindows[appName].on("closed", () => {
        appWindows[appName] = null;
    })
}

function initWindow() {
    browserWindow = new BrowserWindow({
        "width": 800,
        "height": 600
    });
    browserWindow.setFullScreen(true);
    browserWindow.loadURL(url.format({
        "pathname": path.join(__dirname, "BrowserView/index.html"),
        "protocol": "file:",
        "slashes": true
    }));
    browserWindow.on("closed", () => {
        browserWindow = null;
    })
}

app.on("ready", initWindow);
app.on("window-all-closed", () => {
    app.quit();
});

ipcMain.on("synchronous-message", (event, arg) => {
    try {
        var actionType = arg.actionType;
    } catch(e) {
        var actionType = null;
    }
    if(!actionType) {
        event.returnValue = "Unknown action type";
        return;
    }
    if(actionType == "openApp") {
        try {
            var appName = arg.appName;
        } catch(e) {
            var appName = null;
        }
        if(!appName || !appPaths[appName]) {
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