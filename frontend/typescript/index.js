var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
require("babel-polyfill");
function sleep(ms) {
    return new Promise(function (callback) {
        setTimeout(callback, ms);
    });
}
function loadPage() {
    return __awaiter(this, void 0, void 0, function* () {
        var app = new Vue({
            el: "#container",
            data: {
                "testMsg": "Hello world",
                "showTestMsg": true
            }
        });
        yield sleep(1000);
        yield (function () {
            app.$data.testMsg = "...";
            return new Promise(function (callback) {
                setTimeout(callback, 1000);
            });
        })();
        yield (function () {
            app.$data.showTestMsg = false;
            return new Promise(function (callback) {
                setTimeout(callback, 1000);
            });
        })();
    });
}
;
window.addEventListener("load", loadPage);
//# sourceMappingURL=index.js.map