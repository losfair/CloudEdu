package main

import (
    "os"
    "log"
    "strconv"
    "net/http"
    "io/ioutil"
    "encoding/json"
    "DeviceManager"
    "GeneralService"
    "ConfigurationManager"
)

const CLIENT_SERVICE_VERSION = "0.2.0 20161211"

var cfg map[string]interface{}
var isPaused bool = false

func loadConfig() {
    cfg = make(map[string]interface{})
    cfgFilePath, err := ConfigurationManager.GetStringValue("cfgFilePath")
    if err != nil || cfgFilePath == "" {
        cfgFilePath = ConfigurationManager.DEFAULT_CONFIG_FILE_DIR + "config.json"
        ConfigurationManager.SetStringValue("cfgFilePath", cfgFilePath)
    }
    cfgFileData, err := ioutil.ReadFile(cfgFilePath)
    if err != nil {
        panic(err)
    }
    err = json.Unmarshal(cfgFileData, &cfg)
    if err != nil {
        panic(err)
    }
}

func onPing(w http.ResponseWriter, r *http.Request) {
    if isPaused {
        return
    }
    w.Write([]byte("Pong"))
}

func onGetVersion(w http.ResponseWriter, r *http.Request) {
    if isPaused {
        return
    }
    w.Write([]byte(CLIENT_SERVICE_VERSION))
}

func onGetDriveList(w http.ResponseWriter, r *http.Request) {
    if isPaused {
        return
    }
    drives := DeviceManager.GetDriveList()
    result, err := json.Marshal(drives)
    if err != nil {
        w.Write([]byte("Failed"))
        return
    }
    w.Write(result)
}

func onGetConfigItem(w http.ResponseWriter, r *http.Request) {
    if isPaused {
        return
    }
    defer func() {
        if err := recover(); err != nil {
            w.Write([]byte("Failed"))
        }
    }()

    reqBodyData, err := ioutil.ReadAll(r.Body)
    if err != nil {
        panic(err)
    }
    defer r.Body.Close()
    reqBody := make(map[string]interface{})
    err = json.Unmarshal(reqBodyData, &reqBody)
    if err != nil {
        panic(err)
    }
    v := cfg[reqBody["key"].(string)]
    switch v.(type) {
        case map[string]interface{}:
            result, err := json.Marshal(v)
            if err != nil {
                panic(err)
            }
            w.Write(result)
            break
        case []interface{}:
            result, err := json.Marshal(v)
            if err != nil {
                panic(err)
            }
            w.Write(result)
            break
        case float64:
            result := strconv.FormatFloat(v.(float64), 'g', 2, 64)
            w.Write([]byte(result))
            break
        case string:
            w.Write([]byte(v.(string)))
            break
        default:
            w.Write([]byte("Unknown type"))
    }
}

func onServiceStart() {
    go http.ListenAndServe("127.0.0.1:9033", nil)
}

func onServicePause() {
    isPaused = true
}

func onServiceContinue() {
    isPaused = false
}

func onServiceStop() {
}

func main() {
    const svcName = "CloudEdu Client Service"
    const svcDesc = "CloudEdu Client Service"

    loadConfig()

    http.HandleFunc("/ping", onPing)
    http.HandleFunc("/version", onGetVersion)
    http.HandleFunc("/config/get", onGetConfigItem)
    http.HandleFunc("/devices/drives/list", onGetDriveList)

    cmd := ""

    if len(os.Args) >= 2 {
        cmd = os.Args[1]
    }

    err := GeneralService.Run(svcName, svcDesc, cmd, &GeneralService.ServiceHandlers{
        OnStart: onServiceStart,
        OnStop: onServiceStop,
        OnPause: onServicePause,
        OnContinue: onServiceContinue,
    })
    if err != nil {
        log.Fatal(err)
    }
}
