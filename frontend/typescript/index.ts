/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/vue/vue.d.ts" />

require("babel-polyfill");

function sleep(ms: number) {
    return new Promise(function(callback) {
        setTimeout(callback, ms);
    });
}

function onLoginClick() {
    alert("Hello world");
}

async function loadPage () {
    var app = new Vue({
        el: "#container",
        data: {
            "testMsg": "Hello world",
            "showTestMsg": true
        },
        methods: {
            "onLoginClick": onLoginClick
        }
    });
};

window.addEventListener("load", loadPage);
