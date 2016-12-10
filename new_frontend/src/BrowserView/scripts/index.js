const CURRENT_VERSION = "0.1.0";
const CURRENT_BUILD = "20161210";
const CLIENT_SERVICE_ADDR = "http://127.0.0.1:9033/";

const request = require("request");
const process = require("process");
const os = require("os");
const {ipcRenderer} = require("electron");
const $ = require("jquery");

let clientServiceRunning = false;

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

function getConfigItem(key, callback) {
    request.post({
        "url": CLIENT_SERVICE_ADDR + "config/get",
        "body": JSON.stringify({
            "key": key
        })
    }, (err, resp, body) => {
        if(err || !body) callback(null);
        else callback(body);
    });
}

function showDialog(title, content) {
    $("#main-dialog-ok-button").unbind("click");
    $("#main-dialog-ok-button").click(() => {
        $("#main-dialog").hide();
    });
    $("#main-dialog-title").text(title);
    $("#main-dialog-content").text(content);
    $("#main-dialog").css("top", window.innerHeight / 2 - parseInt($("#main-dialog").css("height")) / 2)
    $("#main-dialog").show();
}

function tryShowNoClientServiceWarning() {
    if(clientServiceRunning) return;
    showDialog(texts[".text-warning-title"], texts[".text-warning-no-client-service"]);
}

function checkClientService() {
    request.get(CLIENT_SERVICE_ADDR + "ping", (err, resp, body) => {
        if(err || body != "Pong") clientServiceRunning = false;
        else clientServiceRunning = true;
        if(clientServiceRunning) $(".show-if-no-client-service").hide();
        else $(".show-if-no-client-service").show();
        setTimeout(tryShowNoClientServiceWarning, 3000);
    });
}

window.addEventListener("load", () => {
    updateTexts();
    checkClientService();
    $(".goto-home").click(() => {
        $(".page-content").fadeOut();
        $("#main-container").fadeIn();
    });
    $(".do-exit").click(() => {
        window.close();
    });
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

function showSettings() {
    $(".page-content").fadeOut();
    $("#settings-container").load("settings.html", () => {
        updateTexts();
        $("#settings-container").fadeIn();
    });
}

function openAlphaBoard() {
    ipcRenderer.sendSync("synchronous-message", {
        "actionType": "openApp",
        "appName": "AlphaBoard"
    });
}