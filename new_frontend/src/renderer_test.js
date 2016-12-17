const request = require("request");
const fs = require("fs");

var fileData = fs.readFileSync(process.argv[2], "utf-8");
request.post("http://127.0.0.1:9033/render_template", {
    "json": {
        "template": fileData
    }
}, (err, resp, body) => {
    console.log(body);
});
