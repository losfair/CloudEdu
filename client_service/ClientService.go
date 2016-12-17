package main

import (
    "os"
    "log"
    "time"
    "strconv"
    "net/http"
    "io/ioutil"
    "crypto/rand"
    "encoding/hex"
    "encoding/json"
    "DeviceManager"
    "GeneralService"
    "TemplateRenderer"
    "ConfigurationManager"
)

const CLIENT_SERVICE_VERSION = "0.3.0 20161217"

var deviceId string
var cfg map[string]interface{}
var isPaused bool = false
var driveListUpdateChan chan []string
var currentDriveList []string

func generateRandomString(n int) string {
    r := make([]byte, n)
    rand.Read(r)
    return hex.EncodeToString(r)
}

func loadDeviceId() {
    currentDeviceId, err := ConfigurationManager.GetStringValue("deviceId")
    if err != nil || currentDeviceId == "" {
        currentDeviceId = generateRandomString(32)
        ConfigurationManager.SetStringValue("deviceId", currentDeviceId)
    }
    deviceId = currentDeviceId
}

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

func onPollDriveListUpdate(w http.ResponseWriter, r *http.Request) {
    if isPaused {
        return
    }
    select {
        case update := <-driveListUpdateChan:
            respJson, err := json.Marshal(update)
            if err != nil {
                w.Write([]byte("Error"))
                return
            }
            w.Write(respJson)
        case <-time.After(30 * time.Second):
            w.Write([]byte("Timeout"))
    }
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

func onGetDeviceId(w http.ResponseWriter, r *http.Request) {
    if isPaused {
        return
    }
    w.Write([]byte(deviceId))
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

func onReboot(w http.ResponseWriter, r *http.Request) {
    ret := DeviceManager.RequestSystemReboot()
    if ret {
        DeviceManager.DoSystemReboot()
        w.Write([]byte("OK"))
    } else {
        w.Write([]byte("Failed"))
    }
}

func onPoweroff(w http.ResponseWriter, r *http.Request) {
    ret := DeviceManager.RequestSystemPoweroff()
    if ret {
        DeviceManager.DoSystemPoweroff()
        w.Write([]byte("OK"))
    } else {
        w.Write([]byte("Failed"))
    }
}

func onTemplateRenderRequest(w http.ResponseWriter, r *http.Request) {
    defer func() {
        if err := recover(); err != nil {
            w.Write([]byte("Unknown error"))
        }
    }()

    reqRawData, err := ioutil.ReadAll(r.Body)
    if err != nil {
        w.Write([]byte("Failed"))
        return
    }
    defer r.Body.Close()
    reqData := make(map[string]interface{})
    err = json.Unmarshal(reqRawData, &reqData)
    if err != nil {
        w.Write([]byte("Unable to parse request"))
        return
    }

    tpl := reqData["template"].(string)
    doc := TemplateRenderer.LoadDocumentFromSource([]byte(tpl))
    if doc == nil {
        w.Write([]byte("Unable to load template"))
        return
    }
    defer doc.Destroy()

    if v, ok := reqData["params"]; ok {
        params := v.(map[string]interface{})
        for key, value := range params {
            strValue := "";
            switch value.(type) {
                case string:
                    strValue = value.(string)
                case float64:
                    strValue = strconv.FormatFloat(value.(float64), 'g', -1, 64)
                case bool:
                    strValue = "false"
                    if value.(bool) {
                        strValue = "true"
                    }
                default:
                    strValue = ""
            }
            doc.SetParam(key, strValue)
        }
    }

    w.Write([]byte(doc.GenerateJavascriptRenderer(false)))
}

func updateDriveList() {
    newDrives := DeviceManager.GetDriveList()
    if len(newDrives) != len(currentDriveList) {
        currentDriveList = newDrives
        select {
            case driveListUpdateChan <- newDrives:
            default:
        }
    }
}

func runBackgroundTasks() {
    for {
        updateDriveList()
        time.Sleep(1 * time.Second)
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

    loadDeviceId()
    loadConfig()
    DeviceManager.Init()
    go runBackgroundTasks()

    http.HandleFunc("/ping", onPing)
    http.HandleFunc("/version", onGetVersion)
    http.HandleFunc("/id", onGetDeviceId)
    http.HandleFunc("/config/get", onGetConfigItem)
    http.HandleFunc("/devices/drives/list", onGetDriveList)
    // http.HandleFunc("/devices/drives/poll", onPollDriveListUpdate) // Fixme: Not working
    http.HandleFunc("/system/power/reboot", onReboot)
    http.HandleFunc("/system/power/poweroff", onPoweroff)
    http.HandleFunc("/render_template", onTemplateRenderRequest)

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
