var socket = new WebSocket('http://localhost:8081', 'chat')

socket.onopen = function () {
    const myMsgPrinter = new msgPrinter()
    const msgField = document.getElementById('msger-input')
    var openMsg = true
    var option = "userJoin"
    var myName = "user"
    

    myMsgPrinter.left("Welcome! To start, please choose a username that I can remember u by. Or remind me of who you are if we talked before!")

    const form = document.getElementById("msger-inputarea")
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if(openMsg && msgField.value !== "") {
            var inputValue = msgField.value
            msgField.value = ""

            switch(option) {
                case "userJoin":
                    myName = inputValue
                    socket.send(`{"option": "userJoin", "name": "${inputValue}"}`)
                    option = "userMsg"
                    break;

                case "userMsg":
                    var msg = inputValue
                    socket.send(`{"option": "userMsg", "msg": ${msg}`)
                    break;
            }
            openMsg = false
            myMsgPrinter.right(myName, inputValue)
        }
    })

    


    socket.onmessage = function (msg) {
        const msgData = JSON.parse(msg.data)

        switch(msgData.option) {
            case "userJoin":
                option = "userMsg"
                break;
            
            case "botAnswer":
                break;
        }

        openMsg = true
        
    }
}





class msgPrinter {

    msger_chat = document.getElementById('msger-chat')
    currentDate = new Date()

    createTimestamp(){
        return `${this.currentDate.getHours().toString().padStart(2, '0')}:${this.currentDate.getMinutes().toString().padStart(2, '0')}`
    }

    createMsg(side, name, pfp, msg) {
        const html = 
`<div class="msg ${side}-msg">
    <div class="msg-img" style="background-image: url(${pfp})"></div>
        <div class="msg-bubble">
            <div class="msg-info">
            <div class="msg-info-name">${name}</div>
            <div class="msg-info-time">${this.createTimestamp()}</div>
        </div>

        <div class="msg-text">
            ${msg}
        </div>
    </div>
</div>
`
        return html
    }

    left(msg) {
        this.msger_chat.innerHTML += this.createMsg("left", "SalesBot", "../img/customer-service.webp", msg)
    }

    right(name, msg) {
        this.msger_chat.innerHTML += (this.createMsg("right", name, "../img/user-pfp.jpeg", msg))
    }
}