const express = require("express");
const bodyParser = require("body-parser")
const util = require("util");
const dbClient = require("mongodb").MongoClient;

const listenPort = 7729;
const dbUrl = "mongodb://127.0.0.1:27017/CloudEdu"
let dbContext;

var app = express();
app.use(bodyParser.json());

app.post("/notification/publish", (req, resp) => {
    if(!req.body
    || !req.body.deviceId
    || !util.isString(req.body.deviceId)
    || !req.body.content
    || !util.isString(req.body.content)) {
        resp.send("Bad request");
        return;
    }
    dbContext.collection("notifications").insert({
        "deviceId": req.body.deviceId,
        "content": req.body.content,
        "time": Date.now()
    }, (err) => {
        if(err) {
            resp.send("Failed");
        } else {
            resp.send("OK");
        }
    })
})

app.post("/notification/fetch", (req, resp) => {
    if(!req.body
    || !req.body.deviceId
    || !util.isString(req.body.deviceId)) {
        resp.send("Bad request");
        return;
    }
    dbContext.collection("notifications").find({
        "deviceId": req.body.deviceId
    }).sort({
        "time": -1
    }).toArray((err, result) => {
        if(err || !result || !result.length) {
            resp.send("Failed");
        } else {
            var ret = [];
            for(var key in result) {
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
    if(err) {
        throw err;
    }
    dbContext = db;
    app.listen(listenPort);
});
