const {app, BrowserWindow, ipcMain} = require("electron");
const url = require("url");
const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const installationHandler = require("./installationHandler.js");

if(installationHandler.handleSquirrelEvent()) {
    return;
}

const SBIE_PATH = "C:\\Program Files\\Sandboxie\\Start.exe";
const appPaths = {
    "AlphaBoard": "BrowserView/AlphaBoard/index.html"
};

let browserWindow = null;
let externalPanel = null;
let appWindows = {};

function tryOpenProgramInSandboxie(cmd, args) {
    if(!fs.existsSync(SBIE_PATH)) return false;
    let newArgs = ["/nosbiectrl", "/silent", cmd];
    for(let item in args) {
        newArgs.push(item);
    }
    child_process.spawn(SBIE_PATH, newArgs);
    return true;
}

function openProgramSafe(cmd, args) {
    if(tryOpenProgramInSandboxie(cmd, args) == false) child_process.spawn(cmd, args);
}

function terminateProgramsInSandboxie() {
    if(!fs.existsSync(SBIE_PATH)) return false;
    child_process.spawn(SBIE_PATH, ["/terminate"]);
    return true;
}

function openExternalPanel() {
    if(externalPanel) return;
    externalPanel = new BrowserWindow({
        "width": 50,
        "height": 50,
        "resizable": false,
        "alwaysOnTop": true,
        "x": 20,
        "y": 20,
        "minimizable": false,
        "frame": false,
        "titleBarStyle": "hidden"
    });
    externalPanel.loadURL(url.format({
        "pathname": path.join(__dirname, "BrowserView/external_program_panel.html"),
        "protocol": "file:",
        "slashes": true
    }));
    externalPanel.on("closed", () => {
        externalPanel = null;
    });
}

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

app.on("ready", () => {
    initWindow();
});

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
    } else if(actionType == "openExternal") {
        try {
            var cmd = arg.cmd;
        } catch (e) {
            var cmd = null;
        }
        if (!cmd) {
            event.returnValue = "Invalid command";
            return;
        }
        try {
            var cmdArgs = arg.args;
        } catch(e) {
            var cmdArgs = null;
        }
        if(!cmdArgs) cmdArgs = [];

        openProgramSafe(cmd, cmdArgs);
        openExternalPanel();

        event.returnValue = "OK";
    } else if (actionType == "terminateExternals") {
        terminateProgramsInSandboxie();
        event.returnValue = "OK";
    } else {
        event.returnValue = "Unknown action type";
        return;
    }
})
