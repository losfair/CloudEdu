"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const mongodb = require("mongodb");
let mongoClient = mongodb.MongoClient;
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
        var result = yield new Promise(function (callback) {
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
function connectToDb() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise(function (callback) {
            mongoClient.connect("mongodb://localhost:27017/CloudEduService", function (err, db) {
                if (err)
                    throw err;
                callback(db);
            });
        });
    });
}
dbContext = connectToDb();
//# sourceMappingURL=Session.js.map