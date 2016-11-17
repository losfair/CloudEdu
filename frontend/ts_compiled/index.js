"use strict";

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
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
    return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function _callee() {
        var app;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        app = new Vue({
                            el: "#container",
                            data: {
                                "testMsg": "Hello world",
                                "showTestMsg": true
                            }
                        });
                        _context.next = 3;
                        return sleep(1000);

                    case 3:
                        _context.next = 5;
                        return function () {
                            app.$data.testMsg = "...";
                            return new Promise(function (callback) {
                                setTimeout(callback, 1000);
                            });
                        }();

                    case 5:
                        _context.next = 7;
                        return function () {
                            app.$data.showTestMsg = false;
                            return new Promise(function (callback) {
                                setTimeout(callback, 1000);
                            });
                        }();

                    case 7:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));
}
;
window.addEventListener("load", loadPage);
//# sourceMappingURL=index.js.map