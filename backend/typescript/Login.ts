/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/request/request.d.ts" />

import request = require("request");
import Session = require("./Session");

const ssoApiUrlPrefix = "https://hyperidentity.ifxor.com/";

async function verifyClientToken(token: string) {
    let respStr: any = await new Promise(function(callback: Function) {
        request.post(
            ssoApiUrlPrefix + "identity/verify/verify_client_token", 
            {
                form: {
                    "client_token": token
                }
            },
            function(err, resp, body) {
                if(err) callback(null);
                else callback(body);
            }
        );
    });

    if(!respStr) {
        return null;
    }

    let respData = null;

    try {
        respData = JSON.parse(respStr);
    } catch(e) {
        return null;
    }

    if(respData.err !== 0) {
        return null;
    }

    return {
        "username": respData.username,
        "domain": respData.domain
    };
}

export async function onVerifyTokenRequest(req, resp) {
    if(!req.body.client_token) {
        resp.send("Invalid client token");
        return;
    }

    let result = await verifyClientToken(req.body.client_token);

    if(!result) {
        resp.send("Unable to verify client token");
        return;
    }

    let sessionInfo = null;
    
    try {
        sessionInfo = await Session.createSession(result.username);
    } catch(e) {
        resp.send("Error while creating session: " + e);
        return;
    }

    sessionInfo["_id"] = "";

    resp.send(JSON.stringify(sessionInfo));
}

export async function onGetSession(req, resp) {
    if(!req.body.sessionId) {
        resp.send("Invalid session id");
        return;
    }

    let sessionInfo = null;

    try {
        sessionInfo = await Session.getSessionInfo(req.body.sessionId);
    } catch(e) {
        resp.send("Error while getting session info: " + e);
        return;
    }

    if(!sessionInfo) {
        resp.send("Session not found.");
        return;
    }

    resp.send(JSON.stringify(sessionInfo));
}

let moduleInitialized = false;

export function initModule(db) {
    if(moduleInitialized) return;
    moduleInitialized = true;

    Session.initModule(db);
}