/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/request/request.d.ts" />

import request = require("request");

const ssoApiUrlPrefix = "https://hyperidentity.ifxor.com/";

async function verifyClientToken(token: string, callback: Function) {
    let reqStr = "client_token=" + encodeURIComponent(token);
    let respStr: any = await new Promise(function(callback: Function) {
        request.post(
            ssoApiUrlPrefix + "identity/verify/verify_client_token", 
            reqStr,
            function(err, resp, body) {
                if(err) callback(null);
                else callback(body);
            }
        );
    });

    if(!respStr) callback(null);

    try {
        var respData = JSON.parse(respStr);
    } catch(e) {
        callback(null);
    }

    if(respData.err !== 0) {
        callback(null);
    }

    callback({
        "username": respData.username,
        "domain": respData.domain
    });
}

export function onVerifyTokenRequest(req, resp) {
    
}