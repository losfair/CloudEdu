const request = require("request");
const $ = require("jquery");

window.addEventListener("load", () => {
    for(var key in texts) {
        $(key).text(texts[key]);
    }
    $("#nav-button-goto-home").click(() => {
        $(".page-content").fadeOut();
        $("#main-container").fadeIn();
    })
});

function showSystemInfo() {
    $(".page-content").fadeOut();
    $("#system-info-container").fadeIn();
    $("#system-info-container").text("Hello world");
}