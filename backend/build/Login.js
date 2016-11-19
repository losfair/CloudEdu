"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const request = require("request");
const Session = require("./Session");
const ssoApiUrlPrefix = "https://hyperidentity.ifxor.com/";
function verifyClientToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        let respStr = yield new Promise(function (callback) {
            request.post(ssoApiUrlPrefix + "identity/verify/verify_client_token", {
                form: {
                    "client_token": token
                }
            }, function (err, resp, body) {
                if (err)
                    callback(null);
                else
                    callback(body);
            });
        });
        if (!respStr) {
            return null;
        }
        let respData = null;
        try {
            respData = JSON.parse(respStr);
        }
        catch (e) {
            return null;
        }
        if (respData.err !== 0) {
            return null;
        }
        return {
            "username": respData.username,
            "domain": respData.domain
        };
    });
}
function onVerifyTokenRequest(req, resp) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.body.client_token) {
            resp.send("Invalid client token");
            return;
        }
        let result = yield verifyClientToken(req.body.client_token);
        if (!result) {
            resp.send("Unable to verify client token");
            return;
        }
        let sessionInfo = null;
        try {
            sessionInfo = yield Session.createSession(result.username);
        }
        catch (e) {
            resp.send("Error while creating session: " + e);
            return;
        }
        sessionInfo["_id"] = "";
        resp.send(JSON.stringify(sessionInfo));
    });
}
exports.onVerifyTokenRequest = onVerifyTokenRequest;
function onGetSession(req, resp) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.body.sessionId) {
            resp.send("Invalid session id");
            return;
        }
        let sessionInfo = null;
        try {
            sessionInfo = yield Session.getSessionInfo(req.body.sessionId);
        }
        catch (e) {
            resp.send("Error while getting session info: " + e);
            return;
        }
        if (!sessionInfo) {
            resp.send("Session not found.");
            return;
        }
        resp.send(JSON.stringify(sessionInfo));
    });
}
exports.onGetSession = onGetSession;
let moduleInitialized = false;
function initModule(db) {
    if (moduleInitialized)
        return;
    moduleInitialized = true;
    Session.initModule(db);
}
exports.initModule = initModule;
//# sourceMappingURL=Login.js.map