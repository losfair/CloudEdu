/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/body-parser/body-parser.d.ts" />
/// <reference path="../typings/mongodb/mongodb.d.ts" />

import mongodb = require("mongodb");
import express = require("express");
import bodyParser = require("body-parser");
import loginHandler = require("./Login");
import userHandler = require("./User");

let mongoClient = mongodb.MongoClient;

const listenPort = 6711;

async function connectToDb() {
    let db = await new Promise(function(callback: Function) {
        mongoClient.connect("mongodb://localhost:27017/CloudEduService", function(err, db) {
            if(err) throw err;
            callback(db);
        });
    });
    return db;
}

async function runApp() {
    let dbContext = await connectToDb();
    loginHandler.initModule(dbContext);
    userHandler.initModule(dbContext);

    let app = express();

    app.use(bodyParser.json());

    app.post("/login/getSession", loginHandler.onGetSession);
    app.post("/login/verifyToken", loginHandler.onVerifyTokenRequest);
    app.post("/user/createUserInfo", userHandler.onCreateUserInfo);
    app.post("/user/modifyUserClass", userHandler.onUserClassModify);

    app.listen(listenPort, function() {
        console.log("Listening on " + listenPort.toString());
    });
}

runApp();