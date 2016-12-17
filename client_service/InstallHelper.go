package main

import (
    "os"
    "strings"
    "os/exec"
    "io/ioutil"
    "WindowsUI"
)

const INSTALL_PREFIX = `C:\CloudEdu\`

func runClientServiceAction(action string) {
    cmd := exec.Command(INSTALL_PREFIX + "ClientService.exe", action)
    cmd.Output()
}

func copyFile(src, dst string) {
    srcData, err := ioutil.ReadFile(src)
    if err != nil {
        WindowsUI.MessageBoxFatal(err.Error())
    }

    if !strings.HasPrefix(dst, INSTALL_PREFIX) {
        WindowsUI.MessageBoxFatal("Illegal destination path")
    }

    err = ioutil.WriteFile(dst, srcData, 0644)
    if err != nil {
        WindowsUI.MessageBoxFatal(err.Error())
    }
}

func main() {
    if len(os.Args) != 2 {
        WindowsUI.MessageBoxFatal("Illegal usage")
    }

    srcDir := os.Args[1] + `\`

    if _, err := os.Stat(INSTALL_PREFIX + "ClientService.exe"); err == nil || !os.IsNotExist(err) {
        userInput := WindowsUI.MessageBox("Notice", "Service already exists. Overwrite?", WindowsUI.MB_YESNO)
        if userInput == WindowsUI.IDNO {
            runClientServiceAction("install")
            runClientServiceAction("start")
            WindowsUI.MessageBox("Notice", "Service not updated.", 0)
            return
        }
        runClientServiceAction("stop")
        runClientServiceAction("remove")
    }

    os.Mkdir(INSTALL_PREFIX, 0644)

    copyFile(srcDir + `bin\ClientService.exe`, INSTALL_PREFIX + "ClientService.exe")
    copyFile(srcDir + `bin\libOxygenMark.dll`, INSTALL_PREFIX + "libOxygenMark.dll")
    copyFile(srcDir + "default_config.json", INSTALL_PREFIX + "config.json")

    runClientServiceAction("install")
    runClientServiceAction("start")
}
