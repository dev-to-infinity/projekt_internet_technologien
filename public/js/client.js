var socket = new WebSocket('http://localhost:8081', 'chat')

socket.onopen = function () {
    const myMsgPrinter = new msgPrinter()
    const msgField = document.getElementById('msger-input')
    var openMsg = true
    var option = "userJoin"
    var msgQueue = []
    const currentDate = new Date()
    var myName = "passenger"

    document.getElementById("msger-send-btn").onclick = () => {
        if(openMsg) {
            msgQueue.push(msgField.value)
            msgField.value = ""

            switch(option) {
                case "userJoin":
                    myName = msgQueue.shift()
                    socket.send(`{"option": "userJoin", "name": "${myName}"}`)
                    firstMsg = false
                    break;

                case "userMsg":
                    socket.send('{"option": "userMsg"}')
                    break;
            }
            openMsg = false
            myMsgPrinter.right(myName, myName, currentDate.getHours() + ":" + currentDate.getMinutes())
        }
    }

    socket.onmessage = function (msg) {
        const msgData = JSON.parse(msg.data)
        alert(msgData)

        switch(msgData.option) {
            case "userJoin":
                option = "userMsg"
                break;
            
            case "botAnswer":
                break;
            case "test":
        }

        openMsg = true
        
    }
}


class msgPrinter {

    msger_chat = document.getElementById('msger-chat')

    createMsg(side, name, pfp, msg, timestamp) {
        const html = 
`<div class="msg ${side}-msg">
    <div class="msg-img" style="background-image: url(${pfp})"></div>
        <div class="msg-bubble">
            <div class="msg-info">
            <div class="msg-info-name">${name}</div>
            <div class="msg-info-time">${timestamp}</div>
        </div>

        <div class="msg-text">
            ${msg}
        </div>
    </div>
</div>`
        return html
    }

    left(msg, timestamp) {
        this.msger_chat.innerHTML += this.createMsg("left", "SalesBot", "../img/customer-service.webp", msg, timestamp)
    }

    right(name, msg, timestamp) {
        this.msger_chat.innerHTML += (this.createMsg("right", name, "../img/user-pfp.jpeg", msg, timestamp))
    }
}