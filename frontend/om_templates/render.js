const fs = require("fs");
const process = require("process");
const om = require("oxygenmark");

if(process.argv.length != 3) {
    throw "Bad usage";
}

const srcFile = process.argv[2];

const constants = JSON.parse(fs.readFileSync("constants.json"));

const doc = new om();
doc.loadFile(srcFile, constants);

console.log(doc.render());

doc.destroy();
