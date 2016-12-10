copy ..\client_service\ClientService.exe src\bin\
copy ..\client_service\Launcher.bat src\bin\
electron-packager src CloudEdu --platform=win32 --arch=all --version=1.4.11 --out=Staging --version-string.ProductName=CloudEdu --version-string.ProductVersion=0.1.0
