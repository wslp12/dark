/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import heroState from '@renderer/recoil/heros.atom'
import { produce } from 'immer'
import { useRecoilState } from 'recoil'

function Skill(props: any): JSX.Element {
  const { hero } = props
  const [atom, setAtom] = useRecoilState(heroState)

  const handleClickSave = async () => {
    console.log(atom)
    const ssdf = await window.electron.ipcRenderer.invoke('electron:write', atom)
    console.log(ssdf)
  }

  const handleChangeRange = (e: any, skill2: any) => {
    setAtom((old) =>
      produce(old, (draft) => {
        const findHero = draft.find((item) => item.name === hero.name)
        findHero.skills = findHero.skills.map((skill) => {
          const findSkill = skill.name === skill2.name
          if (findSkill) {
            return {
              ...skill,
              range: e.target.value
            }
          }
          return skill
        })
      })
    )
  }

  const handleChangeCoolDown = (e: any, skill2: any) => {
    setAtom((old) =>
      produce(old, (draft) => {
        const findHero = draft.find((item) => item.name === hero.name)
        findHero.skills = findHero.skills.map((skill) => {
          const findSkill = skill.name === skill2.name
          if (findSkill) {
            return {
              ...skill,
              coolDown: e.target.value
            }
          }
          return skill
        })
      })
    )
  }

  const handleChangeMinDmg = (e: any, skill2: any) => {
    setAtom((old) =>
      produce(old, (draft) => {
        const findHero = draft.find((item) => item.name === hero.name)
        findHero.skills = findHero.skills.map((skill) => {
          const findSkill = skill.name === skill2.name
          if (findSkill) {
            return {
              ...skill,
              minDmg: e.target.value
            }
          }
          return skill
        })
      })
    )
  }

  const handleChangeMaxDmg = (e: any, skill2: any) => {
    setAtom((old) =>
      produce(old, (draft) => {
        const findHero = draft.find((item) => item.name === hero.name)
        findHero.skills = findHero.skills.map((skill) => {
          const findSkill = skill.name === skill2.name
          if (findSkill) {
            return {
              ...skill,
              maxDmg: e.target.value
            }
          }
          return skill
        })
      })
    )
  }

  const handleChangeCri = (e: any, skill2: any) => {
    setAtom((old) =>
      produce(old, (draft) => {
        const findHero = draft.find((item) => item.name === hero.name)
        findHero.skills = findHero.skills.map((skill) => {
          const findSkill = skill.name === skill2.name
          if (findSkill) {
            return {
              ...skill,
              critical: e.target.value
            }
          }
          return skill
        })
      })
    )
  }

  return (
    <>
      <div>{hero.nameKor}</div>
      <div className="flex flex-col gap-1">
        {hero.skills.map((skill, index) => {
          console.log(skill)
          const imgUrl = new URL(`./assets/${skill.src}.jpg`, import.meta.url).href
          return (
            <div key={skill.name}>
              <div className="flex flex-col flex-shrink-0 border border-neutral-300 p-2 rounded-md">
                <div>
                  <img src={imgUrl} alt="" width={50} height={50} />
                </div>
                <div className="flex text-sm gap-2">
                  <span className={`${skill.name.includes('_u') ? 'text-red-500' : 'text-black'}`}>
                    {skill.nameKor}
                  </span>
                </div>
                <div className="flex text-sm gap-2">
                  <span>{'범위:'}</span>
                  <input
                    className="border border-neutral-200"
                    type="text"
                    onChange={(e) => handleChangeRange(e, skill)}
                    value={`${skill.range}`.toString()}
                  />
                </div>
                <div className="flex text-sm gap-2">
                  <span>{'쿨다운:'}</span>

                  <input
                    className="border border-neutral-200"
                    type="text"
                    value={skill.coolDown.toString()}
                    onChange={(e) => handleChangeCoolDown(e, skill)}
                  />
                </div>
                <div className="flex text-sm gap-2">
                  <span>{'데미지-공격력:'}</span>
                  <input
                    className="border border-neutral-200"
                    type="text"
                    onChange={(e) => handleChangeMinDmg(e, skill)}
                    value={`${skill.minDmg}`}
                  />
                </div>
                <div className="flex text-sm gap-2">
                  <span>{'데미지-레인지:'}</span>
                  <input
                    className="border border-neutral-200"
                    type="text"
                    onChange={(e) => handleChangeMaxDmg(e, skill)}
                    value={skill.maxDmg}
                  />
                </div>
                <div className="flex text-sm gap-2">
                  <span>{'데미지:'}</span>
                  <input
                    disabled
                    className="border border-neutral-200"
                    type="text"
                    value={`${skill.minDmg}-${parseInt(skill.minDmg) + parseInt(skill.maxDmg)}`}
                  />
                </div>
                <div className="flex text-sm gap-2">
                  <span>{'크리티컬:'}</span>

                  <input
                    className="border border-neutral-200"
                    type="text"
                    onChange={(e) => handleChangeCri(e, skill)}
                    value={skill.critical.toString()}
                  />
                </div>
                <button type="button" className="bg-neutral-200" onClick={handleClickSave}>
                  저장
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default Skill
