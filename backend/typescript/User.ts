/// <reference path="../typings/node/node.d.ts" />

import util = require("util");
import Session = require("./Session");

let dbContext = null;

export async function onUserClassModify(req, resp) {
    let userClass = req.body.newUserClass;
    if(!util.isNumber(userClass)) {
        resp.send("Bad new class");
        return;
    }

    let userSession = await Session.getSessionInfo(req.body.sessionId);
    if(!userSession) {
        resp.send("Unable to get user session info");
        return;
    }

    dbContext.collection("users").update({
        "userName": userSession.userName
    }, {
        "$set": {
            "userClass": userClass
        }
    }, function(){});

    resp.send("OK");
}

export async function onCreateUserInfo(req, resp) {
    let userSession = await Session.getSessionInfo(req.body.sessionId);
    if(!userSession) {
        resp.send("Unable to get user session info");
        return;
    }

    let result = await new Promise(function(callback) {
        dbContext.collection("users").find({
            "userName": userSession.userName
        }).limit(1).toArray(function(err, result) {
            if(err || result.length == 0) callback(null);
            else callback(result[0]);
        });
    });

    if(result) {
        resp.send("User info already exists");
        return;
    } else {
        dbContext.collection("users").insert({
            "userName": userSession.userName,
            "userClass": 0
        }, function(err) {
            resp.send("OK");
        });
    }
}

let moduleInitialized = false;

export function initModule(db) {
    if(moduleInitialized) return;
    moduleInitialized = true;

    dbContext = db;
}