const express = require('express')
const app = express()
const path = require('path')
const ejs = require('ejs')
const http = require('http').Server(app)
const io = require('socket.io')(http, { cors: { origin: '*' } })

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'public'))
app.engine('ejs', ejs.renderFile)
app.set('view engine', 'ejs')

const protocol = process.env.PROTOCOL || 'http'
const ip = require('ip').address()
const port = process.env.PORT || 3333


let usersOnline = []
let messages = []

io.on('connect', socket => {

    socket.emit('mySocketId', socket.id)

    socket.on('init', nickname => {
        addUser(socket.id, nickname)
        console.log('entrou')
        console.log('Users Online', usersOnline)
        socket.emit('usersOnline', usersOnline)
        socket.broadcast.emit('usersOnline', usersOnline)
    })

    socket.on('disconnect', () => {
        removeUser(socket.id)
        console.log('saiu')
        console.log('Users Online', usersOnline)
        console.log('Messages', messages)
        socket.broadcast.emit('usersOnline', usersOnline)
    })

    socket.on('sendMessage', ({ to, message, datetime }) => {
        console.log(socket.id, to, message)

        let key = [socket.id, to].sort().toString()


        let indexMessages = null
        let messagesLength = messages.filter((item, index) => {
            if(item.key === key) {
                indexMessages = index
                return true
            }
        }).length
        if(!messagesLength) {
            messages.push({
                key,
                messages: [
                    {
                        socketFrom: socket.id,
                        socketTo: to,
                        message,
                        datetime
                    }
                ]
            })
        } else {
            if(messages[indexMessages].key === key) {
                messages[indexMessages].messages.push(
                    {
                        socketFrom: socket.id,
                        socketTo: to,
                        message,
                        datetime
                    }
                )
            }
        }
        socket.to(to).emit('receivedMessage', { from: socket.id, message, datetime })
        
        console.log(messages)
    })

    socket.on('loadMessages', to => {
        let key = [socket.id, to].sort().toString()
        let loadedMessages = messages.filter(item => item.key === key)
        socket.emit('loadedMessages', loadedMessages)
    })

})
const addUser = (socketId, nickname) => {
    let dataLength = usersOnline.filter(item => item.socketId === socketId).length
    if(!dataLength) {
        usersOnline.push({
            socketId,
            nickname
        })
    }
}

const removeUser = socketId => {
    usersOnline = usersOnline.filter(item => item.socketId !== socketId)
    // caso outro usuário nao esteja online apagar a conversa
    let keysMessagesErase = []
    messages.map(item => {
        let keySplit = item.key.split(',')
        if(keySplit.includes(socketId)) {
            let otherSocketId = keySplit[0] !== socketId ? keySplit[0] : keySplit[1];
            let isOhterSocketIdOnline = usersOnline.filter(item => item.socketId === otherSocketId).length > 0
            if(!isOhterSocketIdOnline)
                keysMessagesErase.push(item.key)
        }
    })
    messages = messages.filter(item => !keysMessagesErase.includes(item.key))
    console.log(messages)
}

app.listen(port, () => console.log(`Server started in http://localhost:${port} or ${protocol}://${ip}:${port}`))
io.listen(3030)
