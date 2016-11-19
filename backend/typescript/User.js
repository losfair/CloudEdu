"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const util = require("util");
const Session = require("./Session");
let dbContext = null;
function onUserClassModify(req, resp) {
    return __awaiter(this, void 0, void 0, function* () {
        let userClass = req.body.newUserClass;
        if (!util.isNumber(userClass)) {
            resp.send("Bad new class");
            return;
        }
        let userSession = yield Session.getSessionInfo(req.body.sessionId);
        if (!userSession) {
            resp.send("Unable to get user session info");
            return;
        }
        dbContext.collection("users").update({
            "userName": userSession.userName
        }, {
            "$set": {
                "userClass": userClass
            }
        }, function () { });
        resp.send("OK");
    });
}
exports.onUserClassModify = onUserClassModify;
function onCreateUserInfo(req, resp) {
    return __awaiter(this, void 0, void 0, function* () {
        let userSession = yield Session.getSessionInfo(req.body.sessionId);
        if (!userSession) {
            resp.send("Unable to get user session info");
            return;
        }
        let result = yield new Promise(function (callback) {
            dbContext.collection("users").find({
                "userName": userSession.userName
            }).limit(1).toArray(function (err, result) {
                if (err || result.length == 0)
                    callback(null);
                else
                    callback(result[0]);
            });
        });
        if (result) {
            resp.send("User info already exists");
            return;
        }
        else {
            dbContext.collection("users").insert({
                "userName": userSession.userName,
                "userClass": 0
            }, function (err) {
                resp.send("OK");
            });
        }
    });
}
exports.onCreateUserInfo = onCreateUserInfo;
let moduleInitialized = false;
function initModule(db) {
    if (moduleInitialized)
        return;
    moduleInitialized = true;
    dbContext = db;
}
exports.initModule = initModule;
//# sourceMappingURL=User.js.map