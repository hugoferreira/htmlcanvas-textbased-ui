const { app, BrowserWindow, Menu } = require('electron')

let isShown = true

app.win = null

app.on('ready', () => {
    app.win = new BrowserWindow({
        width: 820,
        height: 650,
        minWidth: 310,
        minHeight: 350,
        backgroundColor: '#29272b',
        /* icon: __dirname + '/' + { darwin: 'icon.icns', linux: 'icon.png', win32: 'icon.ico' }[process.platform] || 'icon.ico', */
        resizable: true,
        frame: process.platform !== 'darwin',
        skipTaskbar: process.platform === 'darwin',
        autoHideMenuBar: process.platform === 'darwin',
        movable: true,
        webPreferences: { zoomFactor: 1.0, nodeIntegration: true, backgroundThrottling: true }
    })

    app.win.loadURL(`file://${__dirname}/index.html`)

    app.win.on('closed', () => {
        win = null
        app.quit()
    })

    app.win.on('hide', function () {
        isShown = false
    })

    app.win.on('show', function () {
        isShown = true
    })

    app.on('window-all-closed', () => {
        app.quit()
    })

    app.on('activate', () => {
        if (app.win === null) {
            createWindow()
        } else {
            app.win.show()
        }
    })
})

app.inspect = function () {
    app.win.toggleDevTools()
}

app.toggleMenubar = function () {
    app.win.setMenuBarVisibility(!app.win.isMenuBarVisible())
}

app.toggleFullscreen = function () {
    app.win.setFullScreen(!app.win.isFullScreen())
}

app.toggleVisible = function () {
    if (process.platform === 'darwin') {
        if (isShown && !app.win.isFullScreen()) { app.win.hide() } else { app.win.show() }
    } else {
        if (!app.win.isMinimized()) { app.win.minimize() } else { app.win.restore() }
    }
}

app.injectMenu = function (menu) {
    try {
        Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
    } catch (err) {
        console.warn('Cannot inject menu.')
    }
}