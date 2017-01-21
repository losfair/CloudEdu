import * as network from "./network.js";

async function showEventStream() {
    $(".nav-button").removeClass("active");
    $("#nav-button-event-stream").addClass("active");

    $(".page-module").fadeOut();
    $("#event-stream").fadeIn();

    let data = await network.makeRequest("POST", "/et/event_stream/fetch", {
        "count": 100
    });
    data = JSON.parse(data);

    document.getElementById("event-stream-cards").innerHTML = "";

    data.events.forEach(ev => {
        let newCard = document.createElement("div");
        newCard.className = "block-card";

        let time = document.createElement("strong");
        time.style.color = "#7F7F7F";
        time.innerHTML = new Date(ev.eventTime).toLocaleString() + "<br>";

        let title = document.createElement("strong");
        title.innerHTML = ev.eventTitle;

        let content = document.createElement("p");
        content.innerHTML = ev.eventDescription;

        newCard.appendChild(time);
        newCard.appendChild(title);
        newCard.appendChild(content);

        document.getElementById("event-stream-cards").appendChild(newCard);
    });
}

window.showEventStream = showEventStream;
