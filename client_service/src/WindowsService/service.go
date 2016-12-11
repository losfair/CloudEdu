package WindowsService

import (
	"fmt"

	"golang.org/x/sys/windows/svc"
	"golang.org/x/sys/windows/svc/debug"
	"golang.org/x/sys/windows/svc/eventlog"
)

var elog debug.Log

var OnServiceStart func()
var OnServiceStop func()
var OnServicePause func()
var OnServiceContinue func()

type thisService struct{}

func (m *thisService) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (ssec bool, errno uint32) {
	const cmdsAccepted = svc.AcceptStop | svc.AcceptShutdown | svc.AcceptPauseAndContinue
	changes <- svc.Status{State: svc.StartPending}
	if OnServiceStart != nil {
		OnServiceStart()
	}
	changes <- svc.Status{State: svc.Running, Accepts: cmdsAccepted}
loop:
	for {
		c := <-r
		switch c.Cmd {
			case svc.Interrogate:
				changes <- c.CurrentStatus
			case svc.Stop, svc.Shutdown:
				if OnServiceStop != nil {
					OnServiceStop()
				}
				break loop
			case svc.Pause:
				if OnServicePause != nil {
					OnServicePause()
				}
				changes <- svc.Status{State: svc.Paused, Accepts: cmdsAccepted}
			case svc.Continue:
				if OnServiceContinue != nil {
					OnServiceContinue()
				}
				changes <- svc.Status{State: svc.Running, Accepts: cmdsAccepted}
			default:
				elog.Error(1, fmt.Sprintf("Unexpected control request #%d", c))
		}
	}
	changes <- svc.Status{State: svc.StopPending}
	return
}

func runService(name string, isDebug bool) {
	var err error
	if isDebug {
		elog = debug.New(name)
	} else {
		elog, err = eventlog.Open(name)
		if err != nil {
			return
		}
	}
	defer elog.Close()

	elog.Info(1, fmt.Sprintf("Starting %s", name))
	run := svc.Run
	if isDebug {
		run = debug.Run
	}
	err = run(name, &thisService{})
	if err != nil {
		elog.Error(1, fmt.Sprintf("%s failed: %v", name, err))
		return
	}
	elog.Info(1, fmt.Sprintf("%s stopped", name))
}
