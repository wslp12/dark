import { useState } from 'react'
import Skill from './skill'
import { useRecoilState } from 'recoil'
import heroState from './recoil/heros.atom'

function App(): JSX.Element {
  const [heroes, setHeroes] = useRecoilState(heroState)
  const [filePath, setFilePath] = useState(
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Darkest Dungeon® II\\Darkest Dungeon II_Data\\StreamingAssets\\Excel'
  )

  const func: () => Promise<void> = async () => {
    const res = await window.electron.ipcRenderer.invoke('electron:say', filePath)
    console.log(res)
    setHeroes(res)
  }

  // useEffect(() => {
  //   window.electron.ipcRenderer.on('electron:reply', (_, args) => {
  //     console.log(args)
  //   })
  // }, [])

  return (
    <div className="flex p-2">
      <div className="flex flex-col gap-3">
        <div>
          <input
            type="text"
            className="border border-neutral-300 rounded-md w-60"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
          />
          <button className="border border-neutral-300 rounded-md" onClick={func}>
            경로 읽어오기
          </button>
        </div>
        <div className="flex">
          {heroes.map((hero: any) => {
            return <Skill key={hero.name} hero={hero} />
          })}
        </div>
      </div>
    </div>
  )
}

export default App
