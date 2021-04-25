window.onload = init

let nickname = window.prompt("Insira seu nickname:") || "Anônimo"
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
            if(item.socketId !== socketId) {
                boxUsers.innerHTML += `
                    <button class="btn-users-online" id="${item.socketId}" onClick="intoConversation('${item.socketId}')">${item.nickname}</button>
                `
            }
            
        })
    })

    io.on('receivedMessage', ({ from, message, datetime }) => {
        if(from === toSocketId) {
            datetime = datetime.split(' ')[1]  === new Date().toISOString().split('T')[0].split('-').reverse().join('/') ? datetime.split(' ')[0] : datetime
            let inScroll = boxMessages.scrollHeight - (boxMessages.scrollTop + boxMessages.clientHeight) === 0
            boxMessages.innerHTML += "<div class='box-item-message box-to'><div class='item-message to'>"+ message + "<span class='datetime'>"+datetime+"</span></div></div>"
            if(inScroll)
                boxMessages.scrollTo(0, boxMessages.scrollHeight - boxMessages.clientHeight)
        } else {
            $.notify('Você recebeu mensagem de ' + document.getElementById(from).innerText, '');
        }
    })

    form.onsubmit = e => {
        e.preventDefault();
        const message = inputText.value

        if(message) {
            let datetimeFull = new Date().toISOString().split('T')
            let datetime = datetimeFull[1].split('.')[0].split('-').reverse().join('/').substr(0, 5) + ' ' + datetimeFull[0].split('-').reverse().join('/')

            boxMessages.innerHTML += "<div class='box-item-message box-from'><div class='item-message from'>" + message + "<span class='datetime'>"+(datetime.split(' ')[0])+"</span></div></div>"
            boxMessages.scrollTo(0, boxMessages.scrollHeight - boxMessages.clientHeight)

            io.emit('sendMessage', { to: toSocketId, message, datetime })
            inputText.value = ""
            inputText.focus()
        }
    }
}

function intoConversation(socketId) {
    //console.log(socketId)
    if(toSocketId !== socketId) {
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
}

io.on('loadedMessages', loadedMessages => {
    //console.log(loadedMessages)

    if(loadedMessages.length) {
        let messages = loadedMessages[0].messages;
        for(i = 0; i < messages.length; i++) {
            let datetime = messages[i].datetime.split(' ')[1]  === new Date().toISOString().split('T')[0].split('-').reverse().join('/') ? messages[i].datetime.split(' ')[0] : messages[i].datetime
            boxMessages.innerHTML += `
                <div class='box-item-message ${messages[i].socketFrom === socketId ? "box-from" : "box-to"}'>
                    <div class='item-message ${messages[i].socketFrom === socketId ? "from" : "to"}'>
                        ${messages[i].message}
                        <span class='datetime'>${datetime}</span>
                    </div>
                </div>
            `
        }
        boxMessages.scrollTo(0, boxMessages.scrollHeight - boxMessages.clientHeight)
    }
    
})
