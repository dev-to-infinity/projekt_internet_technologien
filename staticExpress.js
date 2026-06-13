var salesBot = require('./salesBot')
var express = require('express')
var http = require('http')
var WSS = require('websocket').server
var fs = require('node:fs')

var firstMsg = "Welcome! To start, please choose a username that I can remember u by. Or remind me of who you are if we talked before!"
var rotationModule = 1000

var curHistory = {
    "SalesBot": {connection: null}
} //Because it should not automatically be saved, or when any user clicks save, but when the SPECIFIC user clicks save; null element for bot

var saveData = {
    "flightsList": {104: {"destination": "Istanbul Airport", "freeSeats": 12, "costPerPerson": "300"}, 309: {"destination": "Chișinău Airport", "freeSeats": 8, "costPerPerson": "20"}, 56: {"destination": "Moscow Airport", "freeSeats": 16, "costPerPerson": "600"}},
    "orders": {
        "pending": {},
        "registered": {}
    }
}
var save = ""

try {
    save = fs.readFileSync('./saveFile.txt', 'utf8', {flag: 'r+'})
    saveData = JSON.parse(save)
} catch (err) {}

var app = express()
app.use(express.static('public'))

// Wir nutzen ein paar statische Ressourcen
app.use('/css', express.static(__dirname + './public/css'))
app.use('/js', express.static(__dirname + './public/js'))
app.use('/img', express.static(__dirname + './public/img'))

var webserver = app.listen(8081, () => { 
  var address = webserver.address()
  console.log(address)
  console.log('Server started at http://localhost:8081')
})

var arr = []

var wss = new WSS({
  httpServer: webserver,
  autoAcceptConnections: false
})

var mySalesBot = new salesBot()
mySalesBot.connect()

var connections = {}


wss.on('request', function (request) {                      //Dont base your logic on the connection! It doesn't survive over multiple sessions and the entire block exists separately for each request/user including the bot!
    var connection = request.accept('chat', request.origin)
    var name

    connection.on('message', function (message) {
        var msgData = JSON.parse(message.utf8Data)
        //console.log(msgData)

        switch(msgData.option) {
            case "userRequest":
                var item
                if(msgData.requestItem == "flightsList"){
                    item = saveData.flightsList
                } 
                else item = saveData.orders
                connection.send(`{"option": "requestAnswer", "item": ${JSON.stringify(item)}}`)
                break
            case "userJoin":
                name = msgData.name
                if(name in saveData && !(name in ["flightsList", "orders"])) {              //in looks for indices, not values!
                    curHistory[name] = Object.assign({"connection": connection}, saveData[name])
                    //console.log(curHistory[name])
                    connection.send(`{"option": "userJoin", "msgHistory": ${JSON.stringify(saveData[name].msgHistory)}}`)
                }
                else {
                    curHistory[name] = {"msgHistory": [firstMsg, name], "msgPath": [], "rotation": 0, "userInstruction": "none", "connection": connection, "curOrder": false}
                    curHistory["SalesBot"].connection.send(`{"option": "firstUserMsg", "name": "${name}"}`)
                }              
                break;

            case "botJoin":
                name = "SalesBot"
                curHistory["SalesBot"].connection = connection
                console.log("Bot successfully joined")
                break;
            
            case "userMsg":
                curHistory["SalesBot"].connection.send(`{"option": "userMsg", "name": "${name}", "msg": "${msgData.msg}", "rotation": ${curHistory[name].rotation}, "userInstruction": "${curHistory[name].userInstruction}", "msgPath": ${JSON.stringify(curHistory[name].msgPath)}}`)
                curHistory[name].msgHistory.push(msgData.msg)
                //JSON.stringify() was used because of the problems an empty array causes in ${}, as it completely vanishes
                break;
            
            case "botAnswer":
                var userInstruction = false
                var item = false
                switch(msgData.result){
                    case "hit":
                        curHistory[msgData.name].msgPath.push(msgData.nodeIndex)
                        curHistory[msgData.name].userInstruction = msgData.userInstruction
                        switch(msgData.serverInstruction){
                            case "detailsPermission":
                                curHistory[msgData.name].curOrder = curHistory[msgData.name].msgHistory[curHistory[msgData.name].msgHistory.length - 1]
                                if(curHistory[msgData.name].curOrder in saveData.flightsList){
                                    msgData.msg += ` Are you fine with the following details? Destination: ${saveData.flightsList[curHistory[msgData.name].curOrder].destination}; Costs per person: ${saveData.flightsList[curHistory[msgData.name].curOrder].costPerPerson}$`
                                }
                                else{
                                    msgData.msg = "Unfortunately that flight ID does not exist. Your chat will be reset soon."
                                    userInstruction = "reset"
                                }
                                break
                            case "initPendingOrder":
                                if(!(msgData.name in saveData.orders.pending)) saveData.orders.pending[msgData.name] = {}
                                saveData.orders.pending[msgData.name][curHistory[msgData.name].curOrder] = "?"
                                fs.writeFile('./saveFile.txt', JSON.stringify(saveData), (err) => {})
                                break;
                            case "saveSeats":
                                var seats = curHistory[msgData.name].msgHistory[curHistory[msgData.name].msgHistory.length - 1]
                                saveData.orders.pending[msgData.name][curHistory[msgData.name].curOrder] = seats
                                fs.writeFile('./saveFile.txt', JSON.stringify(saveData), (err) => {})
                                break
                            case "registerOrder":
                                //console.log(curHistory[msgData.name])
                                var seats = saveData.orders.pending[msgData.name][curHistory[msgData.name].curOrder]
                                if(saveData.flightsList[curHistory[msgData.name].curOrder].freeSeats - seats < 0 || seats < 0){
                                    msgData.msg = "Unfortunately I cannot book this many seats for you. Your chat will be reset soon."
                                    delete saveData.orders.pending[msgData.name][curHistory[msgData.name].curOrder]
                                    delete saveData[name]
                                    fs.writeFile('./saveFile.txt', JSON.stringify(saveData), (err) => {})
                                    userInstruction = "reset"      
                                }
                                else{
                                    saveData.flightsList[curHistory[msgData.name].curOrder].freeSeats -= seats
                                    var totalCost = saveData.flightsList[curHistory[msgData.name].curOrder].costPerPerson * seats
                                    if(!(msgData.name in saveData.orders.registered)) saveData.orders.registered[msgData.name] = {}
                                    if(!(curHistory[msgData.name].curOrder in saveData.orders.registered[msgData.name])) saveData.orders.registered[msgData.name][curHistory[msgData.name].curOrder] = []
                                    var myDate = new Date()
                                    myDate.get
                                    var myDataObj = {"year": myDate.getFullYear(), "month": myDate.getMonth() + 1, "day": myDate.getDate(), "hours": myDate.getHours(), "minutes": myDate.getMinutes()}
                                    item = {"dateTime": myDataObj, "id": curHistory[msgData.name].curOrder, "seats": seats, "totalCost": totalCost}
                                    saveData.orders.registered[msgData.name][curHistory[msgData.name].curOrder].push(item)
                                    delete saveData.orders.pending[msgData.name][curHistory[msgData.name].curOrder]
                                    userInstruction = "redirectConfirmedOrder"
                                    item["id"] = curHistory[msgData.name].curOrder
                                }
                                fs.writeFile('./saveFile.txt', JSON.stringify(saveData), (err) => {})
                                break;
                            case "cancelOrder":
                                break;
                        }
                        curHistory[msgData.name].userInstruction = msgData.userInstruction
                        break;
                    
                    case "miss":
                        curHistory[msgData.name].rotation = curHistory[msgData.name].rotation + 1 % rotationModule
                        break;
                    
                    case "first":
                        break;
                }
                curHistory[msgData.name].msgHistory.push(msgData.msg)
                curHistory[msgData.name].connection.send(`{"option": "answer", "msg": "${msgData.msg}", "userInstruction": "${userInstruction}", "item": ${JSON.stringify(item)}}`)
                break;

            case "reset":
                curHistory[name] = {"msgHistory": [firstMsg, name], "msgPath": [], "rotation": 0, "userInstruction": "none", "connection": curHistory[name].connection, "curOrder": false}
                curHistory["SalesBot"].connection.send(`{"option": "firstUserMsg", "name": "${name}"}`)
                delete saveData[name]
                fs.writeFile('./saveFile.txt', JSON.stringify(saveData), (err) => {})
                break;
            
            case "save":
                var toBeSaved = Object.assign({}, curHistory[name])
                delete toBeSaved['connection']
                saveData[name] = toBeSaved
                var msg = ""
                var worked = true
                fs.writeFile('./saveFile.txt', JSON.stringify(saveData), (err) => {
                    worked = false
                    msg = "Apologies, but the server could currently not save your chat status."
                })
                if(worked) msg = "Chat saved successfully."
                curHistory[name].connection.send(`{"option": "answer", "msg": "${msg}"}`)
                break;
        }
    })
})