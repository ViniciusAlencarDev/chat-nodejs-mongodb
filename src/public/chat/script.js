window.onload = init

let nickname = window.prompt("Insira seu nickname:")
let socketId = ""
let toSocketId = ""

boxUsers = null
form = null
boxMessages = null
inputText = null

io = io.connect("http://localhost:3030");
io.on('mySocketId', mySocketId => socketId = mySocketId)
io.emit('init', nickname)

function init() {

    document.title = nickname + " | Chat"

    boxUsers = document.getElementById("box-users");
    form = document.querySelector('form');
    boxMessages = document.getElementById("box-messages")
    inputText = document.querySelector('form input[type=text]')

    inputText.focus()

    io.on('usersOnline', usersOnline => {
        boxUsers.innerHTML = "";
        usersOnline.map(item => {
            if(item.socketId !== socketId)
            boxUsers.innerHTML += `
                <button class="btn-users-online" id="${item.socketId}" onClick="intoConversation('${item.socketId}')">${item.nickname}</button>
            `
        })
    })

    io.on('receivedMessage', ({ from, message }) => {
        if(from === toSocketId) {
            boxMessages.innerHTML += document.getElementById(from).innerText + ": "+ message + "<br>"
        } else {
            $.notify('Você recebeu mensagem de ' + document.getElementById(from).innerText, '');
        }
    })

    form.onsubmit = e => {
        e.preventDefault();
        const message = inputText.value

        if(message) {
            boxMessages.innerHTML += "Eu" + ": " + message + "<br>"
            io.emit('sendMessage', { to: toSocketId, message })
            inputText.value = ""
            inputText.focus()
        }
    }
}

function intoConversation(socketId) {
    //console.log(socketId)
    toSocketId = socketId
    boxMessages.innerHTML = ""

    data = document.querySelectorAll('.btn-users-online');
    for(i = 0; i < data.length; i++) {
        data[i].classList.remove('item-selected')
    }
    document.getElementById(socketId).classList.add('item-selected')
    io.emit('loadMessages', toSocketId)
     
    inputText.readOnly = false
}

io.on('loadedMessages', loadedMessages => {
    //console.log(loadedMessages)

    if(loadedMessages.length) {
        let messages = loadedMessages[0].messages;
        for(i = 0; i < messages.length; i++) {
            console.log('to', messages[i].socketTo)
            boxMessages.innerHTML += (messages[i].socketFrom === socketId ? "Eu" : document.getElementById(messages[i].socketFrom).innerText) + ": ";
            boxMessages.innerHTML += messages[i].message + "<br>"
        }
    }
    
})
