import * as functions from 'firebase-functions';
import * as io from 'socket.io-client'

function generateUuid() {
  // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
  // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  const chars = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split('')
  for (let i = 0, len = chars.length; i < len; i++) {
    switch (chars[i]) {
      case 'x':
        chars[i] = Math.floor(Math.random() * 16).toString(16)
        break
      case 'y':
        chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16)
        break
    }
  }
  return chars.join('')
}

export const sendCommentScreen = functions.firestore.document('rooms/{roomId}/chat/{chatId}').onCreate((snap, context) => {
  const roomId = context.params.roomId
  const newValue = snap.data()
  const post = {
    position: 'opt_ue',
    size: 'opt_small',
    color: '#190707',
    text: newValue.content,
    uuid: generateUuid(),
    date: new Date().getTime()
  }

  const socket = io.connect('https://commentscreen.com', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 100
  })
  const message = JSON.stringify(post)
  return new Promise((resolve, reject) => {
    socket.on('connect', (_socket: SocketIOClient.Socket) => {
      const joinRoom = new Promise((_resolve, _reject) => {
        _socket.emit('join', { room: roomId }, _resolve)
      })
      const sendMessage = new Promise((_resolve, _reject) => {
        _socket.emit('message', message, _resolve)
      })
      const joined = Promise.resolve().then(() => {
        return joinRoom
      }).then(() => {
        return sendMessage
      })
      joined.then(() => {
        console.log('send message to ' + roomId + ': ' + message)
        resolve()
      }).catch(() => {
        console.log('error')
        reject()
      })
    })
  })
})
