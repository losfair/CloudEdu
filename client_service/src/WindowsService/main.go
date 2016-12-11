package WindowsService

import (
	"errors"

	"golang.org/x/sys/windows/svc"
)

func DoAction(svcName, svcDesc, cmd string) error {
	isIntSess, err := svc.IsAnInteractiveSession()
	if err != nil {
		return err
	}
	if !isIntSess {
		runService(svcName, false)
		return nil
	}

	switch cmd {
		case "debug":
			runService(svcName, true)
			return nil
		case "install":
			err = installService(svcName, svcDesc)
		case "remove":
			err = removeService(svcName)
		case "start":
			err = startService(svcName)
		case "stop":
			err = controlService(svcName, svc.Stop, svc.Stopped)
		case "pause":
			err = controlService(svcName, svc.Pause, svc.Paused)
		case "continue":
			err = controlService(svcName, svc.Continue, svc.Running)
		default:
			err = errors.New("Unknown command")
	}

	return err
}
