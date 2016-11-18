"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const loginHandler = require("./Login");
const listenPort = 6711;
let app = express();
app.use(bodyParser.json());
app.post("/login/verifyToken", loginHandler.onVerifyTokenRequest);
app.listen(listenPort, function () {
    console.log("Listening on " + listenPort.toString());
});
//# sourceMappingURL=CloudEduService.js.map