var socket = new WebSocket('http://localhost:8081', 'chat')           //change localhost to your ip if you want it to work from another device, then type http://yourIP:8081

const msger_chat = document.getElementById('msger-chat')
const optionBtns = document.getElementsByClassName('msger-options-btn')
const startMsg = "Welcome! To start, please choose a username that I can remember u by. Or remind me of who you are if we talked before!"
const url = document.URL
var pendingOrdersUl
var registeredOrdersUl
var docName = ""
if(url.includes("flights")) docName = "flights"
else if(url.includes("orders")) docName = "orders"

socket.onopen = function () {
    const myMsgPrinter = new msgPrinter()
    const msgField = document.getElementById('msger-input')
    var openMsg = true
    var option = "userJoin"
    var myName = "user"
    var optionsAllowed = false

    myMsgPrinter.left(startMsg)

    if(docName == "flights") socket.send(`{"option": "userRequest", "requestItem": "flightsList"}`)
    else {
        pendingOrdersUl = document.getElementById('pending_orders_ul')
        registeredOrdersUl = document.getElementById('registered_orders_ul')
    }

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
        }
    }

    resetBtn.onclick = () => {
        if(openMsg && optionsAllowed){
            msger_chat.innerHTML = ""
            myMsgPrinter.right(myName, "Reset")
            openMsg = false
            socket.send(`{"option": "reset"}`)
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
                if(docName == "orders") socket.send(`{"option": "userRequest", "requestItem": "orders"}`)
                else openMsg = true
                alert(0)
                break

            case "answer":
                myMsgPrinter.left(msgData.msg)
                switch(msgData.userInstruction){
                    case "reset":
                        openMsg = false
                        setTimeout(() => {
                            msger_chat.innerHTML = ""
                            socket.send(`{"option": "reset"}`)
                        }, 5000)
                        break
                    case "redirectConfirmedOrder":
                        openMsg = false
                        var item = msgData.item
                        setTimeout(() => {
                            msger_chat.innerHTML = ""
                            socket.send(`{"option": "reset"}`)
                            const myWindow = window.open('./details.html')
                            myWindow.addEventListener('load', () => {
                                var detailsDocument = myWindow.document
                                detailsDocument.getElementById('details_about').innerHTML = `<div id="details_about_content"><h1>Here are the details:</h1></div>` //reset
                                var myString = ""
                                myString += `<p>Date of purchase: ${item.dateTime.day}.${item.dateTime.month}.${item.dateTime.year}, ${item.dateTime.hours.toString().padStart(2, '0')}:${item.dateTime.minutes.toString().padStart(2, '0')}</p>`
                                myString += `<p>Flight-ID: ${item.id}</p>`
                                myString += `<p>Amount of seats booked: ${item.seats}</p>`
                                myString += `<p>Total cost: ${item.totalCost}$</p>`
                                myString += `<h1>Thank you!</h1>`
                                detailsDocument.getElementById('details_about_content').innerHTML += myString
                            })
                        }, 5000)
                        break
                        case "redirectCanceledOrder":
                            openMsg = false
                            var item = msgData.item
                            setTimeout(() => {
                                msger_chat.innerHTML = ""
                                socket.send(`{"option": "reset"}`)
                                const myWindow = window.open('./details.html')
                                myWindow.addEventListener('load', () => {
                                    var detailsDocument = myWindow.document
                                    detailsDocument.getElementById('details_about').innerHTML = `<div id="details_about_content"><h1>The following order was cancelled:</h1></div>` //reset
                                    var myString = ""
                                    myString += `<p>Date of purchase: ${item.dateTime.day}.${item.dateTime.month}.${item.dateTime.year}, ${item.dateTime.hours.toString().padStart(2, '0')}:${item.dateTime.minutes.toString().padStart(2, '0')}</p>`
                                    myString += `<p>Flight-ID: ${item.id}</p>`
                                    myString += `<p>Amount of seats: ${item.seats}</p>`
                                    myString += `<p>Total cost (Will be returned to you ASAP): ${item.totalCost}$</p>`
                                    myString += `<h1>See you soon.</h1>`
                                    detailsDocument.getElementById('details_about_content').innerHTML += myString
                                })
                            }, 5000)
                        break
                    default:
                        if(docName == "orders") socket.send(`{"option": "userRequest", "requestItem": "orders"}`)
                        else openMsg = true
                    
                }
                break
            
            case "requestAnswer":
                var item = msgData.item
                if(docName == "flights"){
                    var destinationList = document.getElementsByClassName('destination')
                    var seatsList = document.getElementsByClassName('seats')
                    var costList = document.getElementsByClassName('cost')

                    var indices = [104, 309, 562]
                    for(var i in indices){
                        destinationList[i].innerHTML = `From: Montenegro Airport, To: ${item[indices[i]].destination}`
                        seatsList[i].innerHTML = `Free seats: ${item[indices[i]].freeSeats}`
                        costList[i].innerHTML = `Cost per person: ${item[indices[i]].costPerPerson}$`
                    }
                }
                else {
                    pendingOrdersUl.innerHTML = ""
                    registeredOrdersUl.innerHTML = ""
                    for(i in item.pending){
                        pendingOrdersUl.innerHTML += `<li>Flight ID: ${i}, Seats: ${item.pending[i]}</li>`
                    }

                    var orderID = 0
                    for(i in item.registered){
                        for(j in item.registered[i]){
                            var myString = ""
                            myString += `<li>Order-ID: ${i}${j}; `
                            orderID++
                            myString += `Date of purchase: ${item.registered[i][j].dateTime.day}.${item.registered[i][j].dateTime.month}.${item.registered[i][j].dateTime.year}, ${item.registered[i][j].dateTime.hours.toString().padStart(2, '0')}:${item.registered[i][j].dateTime.minutes.toString().padStart(2, '0')};   `
                            myString += `Flight-ID: ${item.registered[i][j].id};   `
                            myString += `Amount of seats booked: ${item.registered[i][j].seats};   `
                            myString += `Total cost: ${item.registered[i][j].totalCost}$</li>`
                            registeredOrdersUl.innerHTML += myString
                        }
                    }
                    openMsg = true
                }
                break
        }
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