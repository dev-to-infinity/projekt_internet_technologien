var socket = new WebSocket('http://localhost:8081', 'chat')           //change localhost to your ip if you want it to work from another device, then type http://yourIP:8081

const msger_chat = document.getElementById('msger-chat')
const optionBtns = document.getElementsByClassName('msger-options-btn')
const startMsg = "Welcome! To start, please choose a username that I can remember u by. Or remind me of who you are if we talked before!"

socket.onopen = function () {
    const myMsgPrinter = new msgPrinter()
    const msgField = document.getElementById('msger-input')
    var openMsg = true
    var option = "userJoin"
    var myName = "user"
    var optionsAllowed = false

    myMsgPrinter.left(startMsg)

    const form = document.getElementById("msger-inputarea")
    form.addEventListener('submit', function(event) {
        event.preventDefault();        //Disallows the reload after a submit!

        if(openMsg && msgField.value !== "") {
            var inputValue = msgField.value
            msgField.value = ""

            switch(option) {
                case "userJoin":
                    myName = inputValue
                    socket.send(`{"option": "userJoin", "name": "${inputValue}"}`)
                    option = "userMsg"
                    optionsAllowed = true
                    break;

                case "userMsg":
                    var msg = inputValue
                    socket.send(`{"option": "userMsg", "msg": "${msg}"}`)
                    break;
            }
            openMsg = false
            myMsgPrinter.right(myName, inputValue)
        }
    })

    const saveBtn = document.getElementById('saveBtn')
    const resetBtn = document.getElementById('resetBtn')

    saveBtn.onclick = () => {
        if(openMsg && optionsAllowed){
            myMsgPrinter.right(myName, "Save")
            openMsg = false
            socket.send(`{"option": "save"}`)
            alert("sent: save")
        }
    }

    resetBtn.onclick = () => {
        if(openMsg && optionsAllowed){
            msger_chat.innerHTML = ""
            myMsgPrinter.right(myName, "Reset")
            openMsg = false
            socket.send(`{"option": "reset"}`)
            alert("sent: reset")
        }
    }

    socket.onmessage = (msg) => {
        const msgData = JSON.parse(msg.data)

        switch (msgData.option) {
            case "userJoin":
                option = "userMsg"
                msger_chat.innerHTML = ""
                for (i in msgData.msgHistory) {
                    if (i % 2 == 0) {
                        myMsgPrinter.left(msgData.msgHistory[i])
                    }
                    else {myMsgPrinter.right(myName, msgData.msgHistory[i])} 
                }
                break

            case "answer":
                myMsgPrinter.left(msgData.msg)
                break
        }
        openMsg = true
    }
}





class msgPrinter {

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
        msger_chat.innerHTML += this.createMsg("left", "SalesBot", "../img/customer-service.webp", msg)
        msger_chat.scrollTop = msger_chat.scrollHeight          //code from third website in notes.txt, medium
    }

    right(name, msg) {
        msger_chat.innerHTML += (this.createMsg("right", name, "../img/user-pfp.jpeg", msg))
        msger_chat.scrollTop = msger_chat.scrollHeight
    }
}