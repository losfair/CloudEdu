/// <reference path="../typings/node/node.d.ts" />

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
    let result = await new Promise(function(callback: Function) {
        dbContext.collection("sessions").insert(sessionInfo, function(err, data) {
            if(err) throw "Unable to create session: Database operation failed";
            callback(data);
        });
    });
    return sessionInfo;
}

export async function getSessionInfo(sessionId: string) {
    if(!sessionId) return null;

    let result = await new Promise(function(callback: Function) {
        dbContext.collection("sessions").find({
            "sessionId": sessionId
        }).toArray(function(err, data) {
            if(err) throw err;
            if(data.length == 0) {
                callback(null);
                return;
            }
            data[0]["_id"] = "";
            callback(data[0]);
        });
    });

    return result;
}


let moduleInitialized = false;

export function initModule(db) {
    if(moduleInitialized) return;
    moduleInitialized = true;
    dbContext = db;
    console.log(dbContext);
}