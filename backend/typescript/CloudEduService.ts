/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/body-parser/body-parser.d.ts" />

import express = require("express");
import bodyParser = require("body-parser");
import loginHandler = require("./Login");

const listenPort = 6711;

let app = express();

app.use(bodyParser.json());

app.post("/login/verifyToken", loginHandler.onVerifyTokenRequest);

app.listen(listenPort, function() {
    console.log("Listening on " + listenPort.toString());
});