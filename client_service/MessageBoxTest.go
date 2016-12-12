package main

import (
    "fmt"
    "WindowsUI"
)

func main() {
    ret := WindowsUI.WTSSendMessage(1, "Hello", "Hello world", WindowsUI.MB_YESNO, 5)
    fmt.Println(ret)
}