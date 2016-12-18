(() => {
    const settingsIdCfgKeyMappings = {
        "alphaboard-server-addr": "AlphaBoard_ServerAddr",
        "background-image-path": "backgroundImage"
    };
    const {dialog} = require("electron").remote;

    function onValueChange(target) {
        if(!settingsIdCfgKeyMappings[target.id]) {
            return;
        }
        setConfigItem(settingsIdCfgKeyMappings[target.id], target.value);
    }

    $(".settings-content-item-value-input").change((e) => {
        onValueChange(e.target);
    });

    $(".select-background-image").click(() => {
        dialog.showOpenDialog({
            "filters": [
                {
                    "name": om_texts["text-image-title"],
                    "extensions": [
                        "jpg",
                        "png"
                    ]
                }
            ]
        }, (filenames) => {
            if(!filenames) {
                showDialog(om_texts["text-error-title"], om_texts["text-no-file-selected"]);
                return;
            }
            $("#background-image-path").val(filenames[0].replace(/\\/g, "/").replace(/ /g, "%20"));
            onValueChange(document.getElementById("background-image-path"));
        })
    })
})();