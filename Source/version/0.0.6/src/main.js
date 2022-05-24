// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, ipcMain} = require('electron')
const exec = require('child_process').exec
const axios = require("axios");

var mainWindow

function createWindow() {
    // 任何你期望执行的cmd命令，ls都可以
    let cmdStr1 = '.\\venv\\Scripts\\python.exe -m flask run --port=23456'
    let cmdPath = app.getAppPath()
    // 子进程名称
    let workerProcess

    runExec(cmdStr1)

    function runExec(cmdStr) {
        workerProcess = exec(cmdStr, {cwd: cmdPath})
        // 打印正常的后台可执行程序输出
        workerProcess.stdout.on('data', function (data) {
            console.log(data)
        })
        // 打印错误的后台可执行程序输出
        workerProcess.stderr.on('data', function (data) {
            console.log(data)
        })
        // 退出之后的输出
        workerProcess.on('close', function (code) {
            console.log(code)
        })
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 820,
        minWidth: 820,
        height: 520,
        minHeight: 520,
        backgroundColor: '#00000000',
        frame: false,
        resizable: false,
        transparent: true,
        icon: './src/img/icon.ico',
        webPreferences: {
            // preload: path.join(__dirname, 'preload.js')
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    })
    Menu.setApplicationMenu(null)

    // and load the index.html of the app.
    mainWindow.loadFile('./src/index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   createWindow()
//
//   app.on('activate', function () {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('ready', createWindow)

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//登录窗口最小化
ipcMain.on('window-min', function () {
    mainWindow.minimize();
})
//关闭窗口
ipcMain.on('window-close', function () {
    mainWindow.close();
    axios.post('http://localhost:23456/shut_down/')
})
app.on('before-quit', () => {
    mainWindow.removeAllListeners('close');
    axios.post('http://localhost:23456/shut_down/')

});
ipcMain.on('destroy',()=>{
    app.exit();
    axios.post('http://localhost:23456/shut_down/')
})

