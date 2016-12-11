go build ClientService.go
mt -manifest ClientService.manifest -outputresource:ClientService.exe

go build InstallHelper.go
mt -manifest InstallHelper.manifest -outputresource:InstallHelper.exe

signtool sign /t http://time.certum.pl/ /sha1 03CC8CF614117AD2B073676754BB97ABA81032DE ClientService.exe
signtool sign /t http://time.certum.pl/ /sha1 03CC8CF614117AD2B073676754BB97ABA81032DE InstallHelper.exe
