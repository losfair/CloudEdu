const CURRENT_VERSION = "0.1.0";
const CURRENT_BUILD = "20161209";

const request = require("request");
const process = require("process");
const {ipcRenderer} = require("electron");
const $ = require("jquery");

function updateTexts() {
    for(var key in texts) {
        $(key).text(texts[key]);
    }
}
window.addEventListener("load", () => {
    updateTexts();
    $(".goto-home").click(() => {
        $(".page-content").fadeOut();
        $("#main-container").fadeIn();
    });
    $(".do-exit").click(() => {
        window.close();
    })
});

function showSystemInfo() {
    $(".page-content").fadeOut();
    $("#system-info-container").load("system_info.html", () => {
        updateTexts();
        $(".current-version").text(CURRENT_VERSION);
        $(".current-build").text(CURRENT_BUILD);
        $(".current-node-version").text(process.version);
        $("#system-info-container").fadeIn();
    });
}

function openAlphaBoard() {
    ipcRenderer.sendSync("synchronous-message", {
        "actionType": "openApp",
        "appName": "AlphaBoard"
    });
}