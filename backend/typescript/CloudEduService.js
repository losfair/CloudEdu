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
const express = require("express");
const bodyParser = require("body-parser");
const loginHandler = require("./Login");
const userHandler = require("./User");
let mongoClient = mongodb.MongoClient;
const listenPort = 6711;
function connectToDb() {
    return __awaiter(this, void 0, void 0, function* () {
        let db = yield new Promise(function (callback) {
            mongoClient.connect("mongodb://localhost:27017/CloudEduService", function (err, db) {
                if (err)
                    throw err;
                callback(db);
            });
        });
        return db;
    });
}
function runApp() {
    return __awaiter(this, void 0, void 0, function* () {
        let dbContext = yield connectToDb();
        loginHandler.initModule(dbContext);
        userHandler.initModule(dbContext);
        let app = express();
        app.use(bodyParser.json());
        app.post("/login/getSession", loginHandler.onGetSession);
        app.post("/login/verifyToken", loginHandler.onVerifyTokenRequest);
        app.post("/user/createUserInfo", userHandler.onCreateUserInfo);
        app.post("/user/modifyUserClass", userHandler.onUserClassModify);
        app.listen(listenPort, function () {
            console.log("Listening on " + listenPort.toString());
        });
    });
}
runApp();
//# sourceMappingURL=CloudEduService.js.map