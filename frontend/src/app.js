import { Elm } from './Main.elm'
import './css/app.scss'

import './codemirror'

window.turnNum = 10
window.language = 'python'
window.runCount = 0

let auth
try {
  auth = JSON.parse(localStorage.getItem('auth'))
} catch (e) {
  localStorage.removeItem('auth')
}

const app = Elm.Main.init({
  node: document.getElementById('root'),
  flags: {
    totalTurns: window.turnNum,
    auth,
    endpoint:
      process.env.NODE_ENV === 'production'
        ? 'https://robotrumble.org/api/v1'
        : 'http://localhost:4000/api/v1',
  },
})

const matchWorker = new Worker('/worker.js')

app.ports.startEval.subscribe(([code1, code2]) => {
  window.runCount++
  matchWorker.postMessage({ code1, code2, turnNum: window.turnNum })
})

matchWorker.onmessage = ({ data }) => {
  if (data.type === 'error') {
    console.log('Worker Error!')
    console.error(data.data)
    app.ports.getError.send(null)
  } else {
    if (data.type === 'getOutput') console.log(data.data)
    app.ports[data.type].send(data.data)
  }
}

app.ports.reportDecodeError.subscribe((error) => {
  console.log('Decode Error!')
  console.error(error)
})

app.ports.storeAuth.subscribe((auth) => {
  localStorage.setItem('auth', JSON.stringify(auth))
})

app.ports.removeAuth.subscribe(() => {
  localStorage.removeItem('auth')
})
