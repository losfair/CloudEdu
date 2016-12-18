copy ..\client_service\ClientService.exe src\bin\
copy ..\client_service\libOxygenMark.dll src\bin\
copy ..\client_service\Launcher.bat src\bin\
copy ..\client_service\InstallHelper.exe src\bin\

cmd /c electron-packager src CloudEdu --overwrite --platform=win32 --arch=x64 --version=1.4.11 --out=Staging --version-string.ProductName=CloudEdu --version-string.ProductVersion=0.2.0
