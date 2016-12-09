const {app, BrowserWindow} = require("electron");
const url = require("url");
const path = require("path");

let browserWindow = null;

function initWindow() {
    browserWindow = new BrowserWindow({
        "width": 800,
        "height": 600
    });
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
