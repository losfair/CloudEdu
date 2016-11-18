/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mongodb/mongodb.d.ts" />

import mongodb = require("mongodb");
let mongoClient = mongodb.MongoClient;

let dbContext = null;

function generateRandomString(l: number) {
    const charList = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = "";

    for(let i = 0; i < l; i++) {
        result += charList[Math.floor(Math.random() * 10000) % charList.length];
    }

    return result;
}

export async function createSession(username: string) {
    let sessionInfo = {
        "sessionId": generateRandomString(16),
        "userName": username,
        "createTime": Date.now()
    };
    var result = await new Promise(function(callback) {
        dbContext.collection("sessions").insert(sessionInfo, function(err, data) {
            if(err) throw "Unable to create session: Database operation failed";
            callback(data);
        });
    });
    return sessionInfo;
}

async function connectToDb() {
    return await new Promise(function(callback) {
        mongoClient.connect("mongodb://localhost:27017/CloudEduService", function(err, db) {
            if(err) throw err;
            callback(db);
        });
    });
}

dbContext = connectToDb();