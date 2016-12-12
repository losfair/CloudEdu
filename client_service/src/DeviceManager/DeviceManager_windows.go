package DeviceManager

import (
    "syscall"
    "WindowsUI"
)

var isInitialized bool = false
var kernel32 *syscall.DLL = nil
var user32 *syscall.DLL = nil

var _getLogicalDrives *syscall.Proc
var _exitWindowsEx *syscall.Proc

func Init() {
    if isInitialized {
        return
    }
    var err error
    kernel32, err = syscall.LoadDLL("kernel32.dll")
    if err != nil {
        panic(err)
    }
    user32, err = syscall.LoadDLL("user32.dll")
    if err != nil {
        panic(err)
    }
    _getLogicalDrives = kernel32.MustFindProc("GetLogicalDrives")
    _exitWindowsEx = user32.MustFindProc("ExitWindowsEx")

    isInitialized = true
}

func parseLogicalDriveList(l uint32) []string {
    ret := make([]string, 0)
    for i := 0; i < 26; i++ {
        if l & 1 == 1 {
            ret = append(ret, string(byte(int('A') + i)))
        }
        l >>= 1
    }
    return ret
}

func GetDriveList() []string {
    Init()
    ret, _, _ := _getLogicalDrives.Call()
    driveList := parseLogicalDriveList(uint32(ret))
    return driveList
}

func RequestSystemReboot() bool {
    userInput := WindowsUI.WTSSendMessage(1, "CloudEdu Notice", "Reboot?", WindowsUI.MB_YESNO, 10)
    if userInput != WindowsUI.IDYES {
        return false
    }
    return true
}

func RequestSystemPoweroff() bool {
    userInput := WindowsUI.WTSSendMessage(1, "CloudEdu Notice", "Poweroff?", WindowsUI.MB_YESNO, 10)
    if userInput != WindowsUI.IDYES {
        return false
    }
    return true
}

func DoSystemReboot() {
    Init()
    _exitWindowsEx.Call(
        uintptr(0x02), // EWX_REBOOT
        uintptr(0),
    )
}

func DoSystemPoweroff() {
    Init()
    _exitWindowsEx.Call(
        uintptr(0x08), // EWX_POWEROFF
        uintptr(0),
    )
}
