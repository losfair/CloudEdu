package main

import (
    "os"
    "strconv"
    "net/http"
    "io/ioutil"
    "encoding/json"
)

const CLIENT_SERVICE_VERSION = "0.1.0 20161210"

var cfg map[string]interface{}

func loadConfig() {
    cfg = make(map[string]interface{})
    cfgFilePath := "config.json"
    if len(os.Args) >= 2 {
        cfgFilePath = os.Args[1]
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
    w.Write([]byte("Pong"))
}

func onGetVersion(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte(CLIENT_SERVICE_VERSION))
}

func onGetConfigItem(w http.ResponseWriter, r *http.Request) {
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

func main() {
    loadConfig()
    http.HandleFunc("/ping", onPing)
    http.HandleFunc("/version", onGetVersion)
    http.HandleFunc("/config/get", onGetConfigItem)
    http.ListenAndServe("127.0.0.1:9033", nil)
}
