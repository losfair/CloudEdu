const installer = require("electron-winstaller");

installer.createWindowsInstaller({
    appDirectory: "..\\Staging\\CloudEdu-win32-x64",
    outputDirectory: "..\\Installer",
    authors: "Heyang Zhou",
    exe: "CloudEdu.exe"
}).then(() => {
    console.log("Done");
}, (e) => {
    console.log(e);
})
