package WindowsUI

import (
    "syscall"
    "unsafe"
)

var _messageBox *syscall.Proc
var _wtsSendMessage *syscall.Proc

const (
    MB_OK                = 0x00000000
    MB_OKCANCEL          = 0x00000001
    MB_ABORTRETRYIGNORE  = 0x00000002
    MB_YESNOCANCEL       = 0x00000003
    MB_YESNO             = 0x00000004
    MB_RETRYCANCEL       = 0x00000005
    MB_CANCELTRYCONTINUE = 0x00000006
    MB_ICONHAND          = 0x00000010
    MB_ICONQUESTION      = 0x00000020
    MB_ICONEXCLAMATION   = 0x00000030
    MB_ICONASTERISK      = 0x00000040
    MB_USERICON          = 0x00000080
    MB_ICONWARNING       = MB_ICONEXCLAMATION
    MB_ICONERROR         = MB_ICONHAND
    MB_ICONINFORMATION   = MB_ICONASTERISK
    MB_ICONSTOP          = MB_ICONHAND

    MB_DEFBUTTON1 = 0x00000000
    MB_DEFBUTTON2 = 0x00000100
    MB_DEFBUTTON3 = 0x00000200
    MB_DEFBUTTON4 = 0x00000300
)

func MessageBox(title, content string, style uint) int {
    Init()
    if _messageBox == nil {
        _messageBox = user32.MustFindProc("MessageBoxW")
    }

    ret, _, _ := _messageBox.Call(
        0,
        uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(content))),
        uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(title))),
        uintptr(style),
    )

    return int(ret)
}

func MessageBoxFatal(content string) {
    MessageBox("Fatal Error", content, MB_ICONERROR)
    panic(content)
}

func WTSSendMessage(sessionId uint, title, content string, style, timeoutSec uint) int {
    Init()
    if _wtsSendMessage == nil {
        _wtsSendMessage = wtsapi32.MustFindProc("WTSSendMessageA")
    }

    var ret int

    _wtsSendMessage.Call(
        0,
        uintptr(sessionId),
        uintptr(unsafe.Pointer(&([]byte(title))[0])),
        uintptr(len(title)),
        uintptr(unsafe.Pointer(&([]byte(content))[0])),
        uintptr(len(content)),
        uintptr(style),
        uintptr(timeoutSec),
        uintptr(unsafe.Pointer(&ret)),
        uintptr(1),
    )

    return ret
}
