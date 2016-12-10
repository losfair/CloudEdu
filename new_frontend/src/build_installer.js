const installer = require("electron-winstaller");

installer.createWindowsInstaller({
    appDirectory: "..\\Staging\\CloudEdu-win32-x64",
    outputDirectory: "..\\Installer",
    authors: "Heyang Zhou",
    description: "The CloudEdu Project",
    title: "CloudEdu",
    name: "CloudEdu",
    exe: "CloudEdu.exe",
    noMsi: true
}).then(() => {
    console.log("Done");
}, (e) => {
    console.log(e);
})
