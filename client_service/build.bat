go build ClientService.go
mt -manifest ClientService.manifest -outputresource:ClientService.exe
signtool sign /t http://time.certum.pl/ /sha1 03CC8CF614117AD2B073676754BB97ABA81032DE ClientService.exe
