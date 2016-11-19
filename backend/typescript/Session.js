"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
let dbContext = null;
function generateRandomString(l) {
    const charList = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < l; i++) {
        result += charList[Math.floor(Math.random() * 10000) % charList.length];
    }
    return result;
}
function createSession(username) {
    return __awaiter(this, void 0, void 0, function* () {
        let sessionInfo = {
            "sessionId": generateRandomString(16),
            "userName": username,
            "createTime": Date.now()
        };
        let result = yield new Promise(function (callback) {
            dbContext.collection("sessions").insert(sessionInfo, function (err, data) {
                if (err)
                    throw "Unable to create session: Database operation failed";
                callback(data);
            });
        });
        return sessionInfo;
    });
}
exports.createSession = createSession;
function getSessionInfo(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!sessionId)
            return null;
        let result = yield new Promise(function (callback) {
            dbContext.collection("sessions").find({
                "sessionId": sessionId
            }).toArray(function (err, data) {
                if (err)
                    throw err;
                if (data.length == 0) {
                    callback(null);
                    return;
                }
                data[0]["_id"] = "";
                callback(data[0]);
            });
        });
        return result;
    });
}
exports.getSessionInfo = getSessionInfo;
let moduleInitialized = false;
function initModule(db) {
    if (moduleInitialized)
        return;
    moduleInitialized = true;
    dbContext = db;
    console.log(dbContext);
}
exports.initModule = initModule;
//# sourceMappingURL=Session.js.map