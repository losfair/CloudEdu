package main

import (
    "os"
    "log"
    "strings"
    "os/exec"
    "io/ioutil"
)

const INSTALL_PREFIX = `C:\CloudEdu\`

func runClientServiceAction(action string) {
    cmd := exec.Command(INSTALL_PREFIX + "ClientService.exe", action)
    cmd.Output()
}

func copyFile(src, dst string) {
    srcData, err := ioutil.ReadFile(src)
    if err != nil {
        log.Fatal(err)
    }

    if !strings.HasPrefix(dst, INSTALL_PREFIX) {
        log.Fatal("Illegal destination path")
    }

    err = ioutil.WriteFile(dst, srcData, 0644)
    if err != nil {
        log.Fatal(err)
    }
}

func main() {
    log.Println("Starting install helper")

    if len(os.Args) != 2 {
        log.Fatal("Illegal usage")
    }

    srcDir := os.Args[1] + `\`

    os.Mkdir(INSTALL_PREFIX, 0644)

    copyFile(srcDir + `bin\ClientService.exe`, INSTALL_PREFIX + "ClientService.exe")
    copyFile(srcDir + "default_config.json", INSTALL_PREFIX + "config.json")

    runClientServiceAction("stop")
    runClientServiceAction("remove")
    runClientServiceAction("install")
    runClientServiceAction("start")

    log.Println("Done")
}