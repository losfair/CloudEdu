if(cloudServiceUrl === undefined) {
    var cloudServiceUrl = "";
}

function loadNotifications() {
    request.post(cloudServiceUrl + "notification/fetch", {
        "json": {
            "deviceId": DEVICE_ID
        }
    }, (err, resp, body) => {
        if(err || !body) {
            return;
        }
        /*try {
            let items = JSON.parse(body);
        } catch(e) {
            showDialog("Error", "Unable to parse notifications: " + JSON.stringify(body));
            return;
        }*/
        let items = body;
        document.getElementById("notifications").innerHTML = "";
        for(let key in items) {
            let item = items[key];
            let newElem = document.createElement("div");
            newElem.className = "notification-card";
            $(newElem).addClass("mdl-shadow--2dp");

            let dateElem = document.createElement("span");
            dateElem.className = "notification-card-date";
            dateElem.innerHTML = "<i class=\"material-icons notification-card-date-icon\">access_time</i> " + new Date(item.time).toLocaleString();
            newElem.appendChild(dateElem);

            let contentElem = document.createElement("p");
            contentElem.className = "notification-card-content";
            let contentHtml = "";
            for(let i in item.content) {
                let ch = item.content[i];
                if(ch == "\n") contentHtml += "<br>";
                else contentHtml += ch;
            }
            contentElem.innerHTML = contentHtml;
            newElem.appendChild(contentElem);
            
            (() => {
                let currentElem = contentElem;
                $(newElem).click(() => {
                    $("#new-notification-form").hide();
                    $(".expand-new-notification-form").show();
                    $("#notifications").css("height", window.innerHeight - 200);
                    $(".notification-card-content").css("line-height", "20px");
                    $(".notification-card-content").css("font-size", "16px");
                    $(currentElem).css("line-height", "60px");
                    $(currentElem).css("font-size", "56px");
                });
            })();
            document.getElementById("notifications").appendChild(newElem);
        }
    })
}

new Promise((cb) => {
    getConfigItem("cloudServiceUrl", (r) => {
        cb(r);
    });
}).then((svcUrl) => {
    if(svcUrl == null) {
        showDialog(texts[".text-error-title"], texts[".text-unable-to-get-service-url"]);
        throw texts[".text-unable-to-get-service-url"];
    }
    cloudServiceUrl = svcUrl;
    $("#notifications").text(texts[".text-notification-loading"]);
    loadNotifications();
    $(".expand-new-notification-form").click(() => {
        $(".expand-new-notification-form").hide();
        $("#new-notification-form").show();
    })
    $(".do-notification-publish").click(() => {
        let text = $("#new-notification").val();
        request.post(cloudServiceUrl + "notification/publish", {
            "json": {
                "deviceId": DEVICE_ID,
                "content": text
            }
        }, (err, resp, body) => {
            if(err || !body || body != "OK") {
                showDialog(texts[".text-error-title"], texts[".text-failed-to-publish-notification"]);
                return;
            }
            showDialog(texts[".text-notice-title"], texts[".text-notification-published"]);
            loadNotifications();
        });
    })
});
