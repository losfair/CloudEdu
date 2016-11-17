"use strict";
const express = require("express");
const listenPort = 6711;
let app = express();
app.get("/", function (req, resp) {
    resp.send("Hello world\n");
});
app.listen(listenPort, function () {
    console.log("Service listening on " + listenPort.toString());
});
//# sourceMappingURL=CloudEduService.js.map