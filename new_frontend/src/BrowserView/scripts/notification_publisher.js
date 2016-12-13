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
            $(newElem).text(item.content);
            $(newElem).html("<strong>" + new Date(item.time).toLocaleString() + "</strong><br>" + $(newElem).html());
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
        showDialog("Error", texts[".text-unable-to-get-service-url"]);
        throw texts[".text-unable-to-get-service-url"];
    }
    cloudServiceUrl = svcUrl;
    loadNotifications();
    $(".do-notification-publish").click(() => {
        let text = $("#new-notification").val();
        request.post(cloudServiceUrl + "notification/publish", {
            "json": {
                "deviceId": DEVICE_ID,
                "content": text
            }
        }, (err, resp, body) => {
            if(err || !body || body != "OK") {
                showDialog("Error", texts[".text-failed-to-publish-notification"]);
                return;
            }
            showDialog("Notice", texts[".text-notification-published"]);
        });
    })
});
