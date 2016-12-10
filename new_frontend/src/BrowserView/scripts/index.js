const CURRENT_VERSION = "0.1.0";
const CURRENT_BUILD = "20161209";

const request = require("request");
const process = require("process");
const os = require("os");
const {ipcRenderer} = require("electron");
const $ = require("jquery");

let currentCpus = os.cpus();
let CURRENT_CPU_MODEL = currentCpus[0].model;
let CURRENT_PLATFORM = os.platform();
let CURRENT_OS_RELEASE = os.release();
let CURRENT_USERNAME = os.userInfo().username;

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

function getUptimeString() {
    let uptime = new Date(os.uptime() * 1000);
    let uptimeString = uptime.getHours() + "h " + uptime.getMinutes() + "m " + uptime.getSeconds() + "s";
    return uptimeString;
}

function showSystemInfo() {
    $(".page-content").fadeOut();
    $("#system-info-container").load("system_info.html", () => {
        updateTexts();
        $(".current-version").text(CURRENT_VERSION);
        $(".current-build").text(CURRENT_BUILD);
        $(".current-cpu-model").text(CURRENT_CPU_MODEL);
        $(".current-platform").text(CURRENT_PLATFORM);
        $(".current-os-release").text(CURRENT_OS_RELEASE);
        $(".current-username").text(CURRENT_USERNAME);
        $(".current-node-version").text(process.version);
        $(".current-uptime").text(getUptimeString());
        $("#system-info-container").fadeIn();
    });
}

function openAlphaBoard() {
    ipcRenderer.sendSync("synchronous-message", {
        "actionType": "openApp",
        "appName": "AlphaBoard"
    });
}