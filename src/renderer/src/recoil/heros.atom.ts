import { atom, atomFamily } from 'recoil'

const heroState = atom({
  key: 'heroState',
  default: []
})

export default heroState
