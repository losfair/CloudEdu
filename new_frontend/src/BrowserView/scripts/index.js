const CURRENT_VERSION = "0.1.5";
const CURRENT_BUILD = "20161214";
const CLIENT_SERVICE_ADDR = "http://127.0.0.1:9033/";

const request = require("request");
const process = require("process");
const url = require("url");
const path = require("path");
const child_process = require("child_process");
const os = require("os");
const fs = require("fs");
const {ipcRenderer, shell} = require("electron");
const $ = require("jquery");

let clientServiceRunning = false;

let currentCpus = os.cpus();
let CURRENT_CPU_MODEL = currentCpus[0].model;
let CURRENT_PLATFORM = os.platform();
let CURRENT_OS_RELEASE = os.release();
let CURRENT_USERNAME = os.userInfo().username;
let CLIENT_SERVICE_VERSION = "Unknown";
let DEVICE_ID = "";

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
        if(err || !body || body == "Failed" || body == "Unknown type") callback(null);
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

function showNotification(content) {
    $("#main-notification-card").text(content);
    $("#main-notification-card").fadeIn();
    setTimeout(() => {
        $("#main-notification-card").fadeOut();
    }, 5000);
}

function showGlobalNotification(content) {
    ipcRenderer.sendSync("synchronous-message", {
        "actionType": "showGlobalNotification",
        "content": content
    });
}

function tryShowNoClientServiceWarning() {
    if(clientServiceRunning) return;
    showDialog(texts[".text-warning-title"], texts[".text-warning-no-client-service"]);
}

function getClientServiceInfo() {
    request.get(CLIENT_SERVICE_ADDR + "version", (err, resp, body) => {
        if(err || !body) return;
        CLIENT_SERVICE_VERSION = body;
    });
    request.get(CLIENT_SERVICE_ADDR + "id", (err, resp, body) => {
        if(err || !body) return;
        DEVICE_ID = body;
    });
}

function checkClientService() {
    request.get(CLIENT_SERVICE_ADDR + "ping", (err, resp, body) => {
        if(err || body != "Pong") clientServiceRunning = false;
        else {
            clientServiceRunning = true;
            getClientServiceInfo();
        }
        if(clientServiceRunning) $(".show-if-no-client-service").hide();
        else $(".show-if-no-client-service").show();
        setTimeout(tryShowNoClientServiceWarning, 3000);
    });
}

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
        $(".current-client-service-version").text(CLIENT_SERVICE_VERSION);
        $(".current-device-id").text(DEVICE_ID.substr(0, 8));
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
        componentHandler.upgradeAllRegistered();
        $("#settings-container").fadeIn();
    });
}

function openNotificationPublisher() {
    $(".page-content").fadeOut()
    $("#notification-publisher-container").load("notification_publisher.html", () => {
        updateTexts();
        componentHandler.upgradeAllRegistered();
        $("#notification-publisher-container").fadeIn()
    });
}

function openProgramSafe(cmd, args) {
    ipcRenderer.sendSync("synchronous-message", {
        "actionType": "openExternal",
        "cmd": cmd,
        "args": args
    });
}

function openFileBrowser() {
    openProgramSafe("explorer.exe", []);
}

function openAlphaBoard() {
    getConfigItem("AlphaBoard_ServerAddr", (v) => {
        if(!v) showDialog(texts[".text-error-title"], texts[".text-no-alphaboard-server-address"]);
        else {
            localStorage["AlphaBoard-ServerAddr"] = v;
            /*ipcRenderer.sendSync("synchronous-message", {
                "actionType": "openApp",
                "appName": "AlphaBoard"
            });*/
            $("#local-app").attr("src","AlphaBoard/index.html");
            $("#local-app").fadeIn();
        }
    })
}

let drives = {};
let isFirstDriveCheck = true;

function startCheckDriveChange() {
    request.get(CLIENT_SERVICE_ADDR + "devices/drives/list", (err, resp, body) => {
        setTimeout(startCheckDriveChange, 1000);
        if(err || !body) return;
        else {
            let parsed = JSON.parse(body);
            let newDrives = {};
            for(let key in parsed) {
                newDrives[parsed[key]] = true;
            }
            if(Object.keys(newDrives).length != Object.keys(drives).length) {
                if(!isFirstDriveCheck) shell.beep();
                if(Object.keys(newDrives).length > Object.keys(drives).length) {
                    for(let key in drives) {
                        delete newDrives[key];
                    }
                    let newDriveNames = "";
                    for(let key in newDrives) {
                        newDriveNames += " " + key;
                        drives[key] = true;
                    }
                    if(!isFirstDriveCheck) showGlobalNotification(texts[".text-drive-added"] + newDriveNames);
                } else {
                    for(let key in newDrives) {
                        delete drives[key];
                    }
                    let newDriveNames = "";
                    for(let key in drives) {
                        newDriveNames += " " + key;
                    }
                    drives = newDrives;
                    if(!isFirstDriveCheck) showGlobalNotification(texts[".text-drive-removed"] + newDriveNames);
                }
            }
            isFirstDriveCheck = false;
        }
    })
}

function startTimerUpdate() {
    let currentTime = new Date();
    let currentHours = currentTime.getHours().toString();
    let currentMinutes = currentTime.getMinutes().toString();
    if(currentHours.length == 1) currentHours = "0" + currentHours;
    if(currentMinutes.length == 1) currentMinutes = "0" + currentMinutes;
    let timeString = currentHours + ":" + currentMinutes;
    $(".current-time").text(timeString);
    setTimeout(startTimerUpdate, 1000);
}

function loadStylesFromConfig() {
    getConfigItem("backgroundImage", (result) => {
        if(!result) return;
        $(document.body).css("background-image", "url(" + "file:///" + result + ")");
    })
}

function showLookupScore() {
    $(".page-content").fadeOut();
    $("#lookup-score-container").load("lookup_score.html", () => {
        componentHandler.upgradeAllRegistered();
        $("#lookup-score-container").fadeIn();
    })
}

function doReboot() {
    request.get(CLIENT_SERVICE_ADDR + "system/power/reboot", () => {});
}

function doPoweroff() {
    request.get(CLIENT_SERVICE_ADDR + "system/power/poweroff", () => {});
}

window.addEventListener("load", () => {
    updateTexts();
    checkClientService();
    loadStylesFromConfig();
    $(".goto-home").click(() => {
        $(".page-content").fadeOut();
        $("#main-container").fadeIn();
    });
    $(".lookup-score").click(() => {
        showLookupScore();
    });
    $(".do-reboot").click(doReboot);
    $(".do-poweroff").click(doPoweroff);
    startCheckDriveChange();
    startTimerUpdate();
});
