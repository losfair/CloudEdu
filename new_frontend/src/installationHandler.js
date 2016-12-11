const {app} = require("electron");
const fs = require("fs");
const child_process = require("child_process");

function copyFile(src, dst) {
    let ret = new Promise((cb, reject) => {
        let reader = fs.createReadStream(src);
        let writer = fs.createWriteStream(dst);
        reader.on("error", reject);
        writer.on("error", reject);
        writer.on("close", () => {
            cb();
        });
        reader.pipe(writer);
    });
    return () => {
        return ret;
    };
}

function runCommand(cmd, args) {
    return () => {
        return new Promise((cb) => {
            let p = child_process.spawn(cmd, args);
            p.on("close", cb);
        });
    }
}

module.exports.handleSquirrelEvent = () => {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = (command, args) => {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
        } catch (error) { }

        return spawnedProcess;
    };

    const spawnUpdate = (args) => {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            runCommand(path.join(__dirname, "bin\\Launcher.bat"), [path.join(__dirname, "bin\\InstallHelper.exe"), __dirname])()
            .then(() => {
                setTimeout(app.quit, 1000);
            });

            return true;

        case '--squirrel-uninstall':
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            app.quit();
            return true;
    }
    console.log("Done");
    return false;
};