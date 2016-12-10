if(!clientServiceRunning) {
    $("#settings-error-message-no-client-service").show();
    $("#settings-content").hide();
} else {
    getConfigItem("AlphaBoard_ServerAddr", (v) => {
        if(!v) return;
        $("#alphaboard-server-addr").val(v);
    });
}
