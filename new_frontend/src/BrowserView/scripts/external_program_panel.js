const {ipcRenderer} = require("electron");

function terminateAll() {
    ipcRenderer.sendSync("synchronous-message", {
        "actionType": "terminateExternals"
    });
    window.close();
}
