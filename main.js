const { app, BrowserWindow, Menu, dialog } = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    const template = [
        {
            label: '🛡️ 설정/편집',
            submenu: [
                { label: '되돌리기', role: 'undo' },
                { label: '다시 실행', role: 'redo' },
                { type: 'separator' },
                { label: '잘라내기', role: 'cut' },
                { label: '복사', role: 'copy' },
                { label: '붙여넣기', role: 'paste' },
                { label: '모두 선택', role: 'selectAll' },
                { type: 'separator' },
                {
                    label: '현재 경로 확인',
                    click: () => win.webContents.send('show-current-path')
                },
                {
                    label: '엑셀 경로 설정',
                    click: async () => {
                        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
                            properties: ['openDirectory'],
                            title: 'Darkest Dungeon II Excel 폴더 선택'
                        });
                        if (!canceled && filePaths.length > 0) {
                            win.webContents.send('set-base-path', filePaths[0]);
                        }
                    }
                },
                {
                    label: '경로 초기화',
                    click: () => win.webContents.send('reset-base-path')
                }
            ]
        },
        {
            label: '👤 영웅',
            submenu: [
                {
                    label: '⚕️ 역병의사',
                    click: () => win.webContents.send('switch-to-hero', 'pd')
                },
                {
                    label: '🪓 야만인',
                    click: () => win.webContents.send('switch-to-hero', 'hel')
                },
                {
                    label: '⚔️ 성전사',
                    click: () => win.webContents.send('switch-to-hero', 'cru')
                },
                {
                    label: '🎸 광대',
                    click: () => win.webContents.send('switch-to-hero', 'jes')
                }


            ]
        },
        {
            label: '🧪 스킬 이펙트/버프',
            click: () => win.webContents.send('switch-view', 'effect-view')
        },
        {
            label: '🤝 관계 및 시스템 설정',
            click: () => win.webContents.send('switch-view', 'relationship-view')
        },
        {
            label: '🗺️ 맵 생성 규칙 설정',
            click: () => win.webContents.send('switch-view', 'map-view')
        }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})