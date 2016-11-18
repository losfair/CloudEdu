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
        let reqStr = "client_token=" + encodeURIComponent(token);
        let respStr = yield new Promise(function (callback) {
            request.post(ssoApiUrlPrefix + "identity/verify/verify_client_token", reqStr, function (err, resp, body) {
                if (err)
                    callback(null);
                else
                    callback(body);
            });
        });
        if (!respStr)
            return null;
        try {
            var respData = JSON.parse(respStr);
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
            sessionInfo = Session.createSession(result.username);
        }
        catch (e) {
            resp.send("Error while creating session: " + e);
            return;
        }
        resp.send(JSON.stringify(sessionInfo));
    });
}
exports.onVerifyTokenRequest = onVerifyTokenRequest;
//# sourceMappingURL=Login.js.map