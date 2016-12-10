const CURRENT_VERSION = "0.1.0";
const CURRENT_BUILD = "20161210";
const CLIENT_SERVICE_ADDR = "http://127.0.0.1:9033/";

const request = require("request");
const process = require("process");
const os = require("os");
const {ipcRenderer, shell} = require("electron");
const $ = require("jquery");

let clientServiceRunning = false;

let currentCpus = os.cpus();
let CURRENT_CPU_MODEL = currentCpus[0].model;
let CURRENT_PLATFORM = os.platform();
let CURRENT_OS_RELEASE = os.release();
let CURRENT_USERNAME = os.userInfo().username;
let CLIENT_SERVICE_VERSION = "Unknown";

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

function showNotification(content) {
    $("#main-notification-card").text(content);
    $("#main-notification-card").fadeIn();
    setTimeout(() => {
        $("#main-notification-card").fadeOut();
    }, 5000);
}

function tryShowNoClientServiceWarning() {
    if(clientServiceRunning) return;
    showDialog(texts[".text-warning-title"], texts[".text-warning-no-client-service"]);
}

function getClientServiceVersion() {
    request.get(CLIENT_SERVICE_ADDR + "version", (err, resp, body) => {
        if(err || !body) return;
        CLIENT_SERVICE_VERSION = body;
    });
}

function checkClientService() {
    request.get(CLIENT_SERVICE_ADDR + "ping", (err, resp, body) => {
        if(err || body != "Pong") clientServiceRunning = false;
        else {
            clientServiceRunning = true;
            getClientServiceVersion();
        }
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
    startCheckDriveChange();
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
        $(".current-client-service-version").text(CLIENT_SERVICE_VERSION);
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
    getConfigItem("AlphaBoard_ServerAddr", (v) => {
        if(!v) showDialog("错误", "无法获取 AlphaBoard 云服务地址。");
        else {
            localStorage["AlphaBoard-ServerAddr"] = v;
            ipcRenderer.sendSync("synchronous-message", {
                "actionType": "openApp",
                "appName": "AlphaBoard"
            });
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
                    if(!isFirstDriveCheck) showNotification(texts[".text-drive-added"] + newDriveNames);
                } else {
                    for(let key in newDrives) {
                        delete drives[key];
                    }
                    let newDriveNames = "";
                    for(let key in drives) {
                        newDriveNames += " " + key;
                    }
                    drives = newDrives;
                    if(!isFirstDriveCheck) showNotification(texts[".text-drive-removed"] + newDriveNames);
                }
            }
            isFirstDriveCheck = false;
        }
    })
}
