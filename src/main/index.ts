import { app, shell, BrowserWindow, ipcMain, protocol, nativeImage } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

/**
 * hel_howling_end: 야만인 비명의 단말마
 * raucious_revelry
 */
const helSkillNames = [
  {
    name: 'hel_howling_end',
    nameKor: '단말마의 일격',
    up: false,
    src: 'hel_11',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_howling_end_u',
    nameKor: '단말마의 일격',
    up: true,
    src: 'hel_11up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_raucous_revelry',
    nameKor: '난잡한 술잔치',
    up: false,
    src: 'hel_10',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_raucous_revelry_u',
    nameKor: '난잡한 술잔치',
    up: true,
    src: 'hel_10up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_breakthrough',
    nameKor: '돌파',
    up: false,
    src: 'hel_9',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_breakthrough_u',
    nameKor: '돌파',
    up: true,
    src: 'hel_9up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_bloodlust',
    nameKor: '혈욕',
    up: false,
    src: 'hel_8',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_bloodlust_u',
    nameKor: '혈욕',
    up: true,
    src: 'hel_8up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_bleed_out',
    nameKor: '출혈',
    up: false,
    src: 'hel_7',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_bleed_out_u',
    nameKor: '출혈',
    up: true,
    src: 'hel_7up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_adrenaline_rush',
    nameKor: '아드레날린 분출',
    up: false,
    src: 'hel_6',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_adrenaline_rush_u',
    nameKor: '아드레날린 분출',
    up: true,
    src: 'hel_6up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_toe_to_toe',
    nameKor: '정면 승부',
    up: false,
    src: 'hel_5',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_toe_to_toe_u',
    nameKor: '정면 승부',
    up: true,
    src: 'hel_5up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_if_it_bleeds',
    nameKor: '유혈사태',
    up: false,
    src: 'hel_4',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_if_it_bleeds_u',
    nameKor: '유혈사태',
    up: true,
    src: 'hel_4up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_barbaric_yawp',
    nameKor: '야만스러운 함성!',
    up: false,
    src: 'hel_3',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_barbaric_yawp_u',
    nameKor: '야만스러운 함성!',
    up: true,
    src: 'hel_3up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_iron_swan',
    nameKor: '강철의 추모곡',
    up: false,
    src: 'hel_2',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_iron_swan_u',
    nameKor: '강철의 추모곡',
    up: true,
    src: 'hel_2up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_wicked_hack',
    nameKor: '강력한 난도질',
    up: false,
    src: 'hel_1',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'hel_wicked_hack_u',
    nameKor: '강력한 난도질',
    up: true,
    src: 'hel_1up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  }
]

const runSkillNames = [
  {
    name: 'run_searing_strike',
    nameKor: '그슬린 타격',
    up: false,
    src: 'hel_1up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  },
  {
    name: 'run_cauterize',
    nameKor: '인두 처치',
    up: false,
    src: 'hel_1up',
    desc: '',
    range: '',
    coolDown: '',
    minDmg: '',
    maxDmg: '',
    critical: ''
  }
]

const hel = {
  name: 'hel',
  nameKor: '야만인',
  fileName: 'hero_hel_data_export.Group.csv',
  skills: helSkillNames
}
const run = {
  name: 'run',
  nameKor: '도망자',
  fileName: 'hero_run_data_export.Group.csv',
  skills: runSkillNames
}

const heroes = [hel, run]

let filePaht = ''

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  ipcMain.handle('electron:write', (event, atom) => {
    console.log(atom)
    atom.map((hero) => {
      console.log(hero.nameKor)
      hero.skills.map((skil) => {
        console.log(skil)
      })
    })
  })

  ipcMain.handle('electron:say', (e, value) => {
    // fs.writeFile('/workdir/dark/some.txt', 'asd', (err) => {
    //   if (err) {
    //     console.log(err)
    //   }
    // })
    filePaht = value

    const result = heroes.map((hero) => {
      const addd = path.join(filePaht, hero.fileName)
      const text = fs.readFileSync(addd, 'utf8')

      const skills = hero.skills.map((skill) => {
        const targetRanksReg = new RegExp(
          `element_start,${skill.name},ActorDataSkill.*?target_ranks,(\\d),(?:(\\d),)*`,
          'gs'
        ).exec(text)
        console.log(targetRanksReg)
        const cooldownReg = new RegExp(
          `element_start,${skill.name},ActorDataSkill.*?m_Cooldown,(\\d),`,
          'gs'
        ).exec(text)
        const statReg = new RegExp(
          `element_start,${skill.name},ActorDataStats\\s.key_map,health_damage,health_damage_range,crit_chance,\\s.add_stats,(\\d+),(\\d+),(\\d\\.?\\d+?),`,
          'gs'
        ).exec(text)

        const skillFirstTargetRanks = targetRanksReg !== null ? targetRanksReg[1] : NaN
        const skillLastTargetRanks =
          targetRanksReg !== null
            ? typeof targetRanksReg[2] === 'undefined'
              ? targetRanksReg[1]
              : targetRanksReg[2]
            : NaN

        const coolDown = cooldownReg !== null ? cooldownReg[1] : NaN
        const minDmg = statReg !== null ? statReg[1] : NaN
        const maxDmg = statReg !== null ? statReg[2] : NaN
        const critical = statReg !== null ? statReg[3] : NaN

        return {
          ...skill,
          range: `${skillFirstTargetRanks}-${skillLastTargetRanks}`,
          coolDown,
          minDmg,
          maxDmg,
          critical
        }
      })
      return {
        ...hero,
        skills
      }
    })
    return result
  })

  // setInterval( () => {
  //   ipcMain.handle('')
  // }, 3000)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
