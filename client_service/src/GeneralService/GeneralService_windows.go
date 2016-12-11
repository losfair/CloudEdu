package GeneralService

import (
    "WindowsService"
)

type ServiceHandlers struct {
    OnStart func()
    OnStop func()
    OnPause func()
    OnContinue func()
}

func Run(svcName, svcDesc, cmd string, handlers *ServiceHandlers) error {
    if handlers != nil {
        WindowsService.OnServiceStart = handlers.OnStart
        WindowsService.OnServiceStop = handlers.OnStop
        WindowsService.OnServicePause = handlers.OnPause
        WindowsService.OnServiceContinue = handlers.OnContinue
    }

    err := WindowsService.DoAction(svcName, svcDesc, cmd)
    return err
}
