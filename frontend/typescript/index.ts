/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/vue/vue.d.ts" />

require("babel-polyfill");

function sleep(ms: number) {
    return new Promise(function(callback) {
        setTimeout(callback, ms);
    });
}

async function loadPage () {
    var app = new Vue({
        el: "#container",
        data: {
            "testMsg": "Hello world",
            "showTestMsg": true
        }
    });
    await sleep(1000);
    await (function() {
        app.$data.testMsg = "...";
        return new Promise(function(callback) {
            setTimeout(callback, 1000);
        });
    })();
    await (function() {
        app.$data.showTestMsg = false;
        return new Promise(function(callback) {
            setTimeout(callback, 1000);
        });
    })();
};

window.addEventListener("load", loadPage);