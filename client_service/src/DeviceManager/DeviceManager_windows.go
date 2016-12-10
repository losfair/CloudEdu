package DeviceManager

import (
    "syscall"
)

var isInitialized bool = false
var kernel32 *syscall.DLL = nil

func Init() {
    if isInitialized {
        return
    }
    var err error
    kernel32, err = syscall.LoadDLL("kernel32.dll")
    if err != nil {
        panic(err)
    }
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
    if !isInitialized {
        Init()
    }
    target := kernel32.MustFindProc("GetLogicalDrives")
    ret, _, _ := target.Call()
    driveList := parseLogicalDriveList(uint32(ret))
    return driveList
}