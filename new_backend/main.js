const express = require("express");
const bodyParser = require("body-parser")
const util = require("util");
const fs = require("fs");
const dbClient = require("mongodb").MongoClient;
const es = require("event-stream-service-sdk");
const uuid = require("uuid");
const assert = require("assert");
const rp = require("request-promise");
const validator = require("./validator.js");

const listenPort = 7729;
const dbUrl = "mongodb://127.0.0.1:27017/CloudEdu";
const ssoPrefix = "https://hyperidentity.ifxor.com/";
const webPrefix = "https://hydrocloud.ntzx.cn/CloudEdu/";
let dbContext;

let cfg = JSON.parse(fs.readFileSync("config.json", "utf-8"));

let esContext = new es.Context(cfg.serviceId, cfg.secretKey);

let app = express();
app.use(bodyParser.json());

function wrap(f) {
    return async function(req, resp) {
        try {
            await f(req, resp);
        } catch(e) {
            console.log(e);
            resp.send("Failed");
        }
    }
}

function AuthRequest(deviceIdPrefix) {
    this.id = uuid.v4();
    this.deviceIdPrefix = deviceIdPrefix;
    this.time = Date.now();
}

let pendingAuths = [];

async function clearPendingAuths() {
    let currentTime = Date.now();
    for(let i = 0; i < pendingAuths.length; ) {
        if(currentTime - pendingAuths[i].time < 300000) break;
        else {
            pendingAuths.splice(i, 1);
        }
    }
}

app.get("/push/auth/:device", wrap(async function(req, resp) {
    assert(
        req.params
        && util.isString(req.params.device)
        && req.params.device.length >= 8
        && validator.validateDeviceId(req.params.device)
    );
    await clearPendingAuths();
    let r = new AuthRequest(req.params.device);
    pendingAuths.push(r);
    resp.send("<script>window.location.replace(\""
        + ssoPrefix + "web/?callback=" + encodeURIComponent(webPrefix + "push/auth_callback/" + r.id) + "#auth"
        + "\");</script>");
}));

app.get("/push/auth_callback/:id", wrap(async function(req, resp) {
    assert(req.params && util.isString(req.params.id) && req.query && util.isString(req.query.client_token));
    await clearPendingAuths();

    let targetId = null, targetDevice = null;

    for(let i = 0; i < pendingAuths.length; i++) {
        if(pendingAuths[i].id == req.params.id) {
            targetId = pendingAuths[i].id;
            targetDevice = pendingAuths[i].deviceIdPrefix;
            break;
        }
    }

    if(!targetId) {
        resp.send("Not found");
        return;
    }

    let ssoRet = await rp.post(ssoPrefix + "identity/verify/verify_client_token", {
        "form": {
            "client_token": req.query.client_token
        }
    });
    ssoRet = JSON.parse(ssoRet);

    if(ssoRet.err !== 0 || !ssoRet.userId || !ssoRet.username) {
        resp.send("Verification failed");
        return;
    }

    let r = await dbContext.collection("push_user_device_auths").find({
        "userId": ssoRet.userId,
        "deviceIdPrefix": targetDevice
    }).toArray();
    if(r && r.length) {
        resp.send("Already authorized");
        return;
    }

    await dbContext.collection("push_user_device_auths").insertOne({
        "userId": ssoRet.userId,
        "username": ssoRet.username,
        "deviceIdPrefix": targetDevice,
        "addTime": Date.now()
    });

    resp.send("OK");
}))

app.post("/notification/publish", wrap(async function (req, resp) {
    if (!req.body
        || !util.isString(req.body.deviceId)
        || !util.isString(req.body.content)
        || req.body.deviceId.length < 8
        || !validator.validateDeviceId(req.body.deviceId)
    ) {
        resp.send("Bad request");
        return;
    }
    await dbContext.collection("notifications").insertOne({
        "deviceId": req.body.deviceId,
        "content": req.body.content,
        "time": Date.now()
    });

    let users = await dbContext.collection("push_user_device_auths").find({
        "deviceIdPrefix": req.body.deviceId.substring(0, 8)
    }).toArray();
    let currentTime = Date.now();
    if(users && users.length) {
        for(let i = 0; i < users.length; i++) {
            esContext.addEvent(users[i].userId, "CloudEdu 通知（来自终端设备）", req.body.content, currentTime).catch(e => console.log(e));
        }
    }
    resp.send("OK");
}))

app.post("/notification/fetch", wrap(async function (req, resp) {
    if (!req.body
        || !util.isString(req.body.deviceId)) {
        resp.send("Bad request");
        return;
    }
    let result = await dbContext.collection("notifications").find({
        "deviceId": req.body.deviceId
    }).sort({
        "time": -1
    }).toArray();

    if (!result || !result.length) {
        resp.send("Failed");
    } else {
        let ret = [];
        for (let key in result) {
            ret.push({
                "content": result[key].content,
                "time": result[key].time
            })
        }
        resp.send(JSON.stringify(ret));
    }
}))

app.post("/notification/fetch_with_prefix", (req, resp) => {
    if (!req.body
        || !req.body.deviceIdPrefix
        || !util.isString(req.body.deviceIdPrefix)
        || req.body.deviceIdPrefix.length < 8
        || !validator.validateDeviceId(req.body.deviceIdPrefix)) {
        resp.send("Bad request or device id");
        return;
    }
    dbContext.collection("notifications").find({
        "deviceId": {
            "$regex": "^" + req.body.deviceIdPrefix
        }
    }).sort({
        "time": -1
    }).toArray((err, result) => {
        if (err || !result || !result.length) {
            resp.send("Failed");
        } else {
            let ret = [];
            for (let key in result) {
                ret.push({
                    "content": result[key].content,
                    "time": result[key].time
                })
            }
            resp.send(JSON.stringify(ret));
        }
    })
})

dbClient.connect(dbUrl, (err, db) => {
    if (err) {
        throw err;
    }
    dbContext = db;
    app.listen(listenPort);
});
