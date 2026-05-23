var salesBot = require('./salesBot')
var express = require('express')
var http = require('http')
var WSS = require('websocket').server

try {
    require('Node:fs')
    console.log("hell yeah")
} catch (err) {console.log("shiii")}

var curMsgHistory = [null]                //Because it should not automatically be saved, or when any user clicks save, but when the SPECIFIC user clicks save; null element for bot

var saveData = 
{
    "length": 1,
    "users": 
    [
        {"name": "SalesBot", "connection": null}
    ] 
}

try {
    var save = fs.readFileSync('C:/serversideSaveFile', 'utf8')
    saveData = JSON.parse(save)
} catch (err) {}

for(var i = 1; i < saveData.users.length; i++) curMsgHistory.push(user.msgHistory)

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

var wss = new WSS({
  httpServer: webserver,
  autoAcceptConnections: false
})

var mySalesBot = new salesBot()
var connections = {}

wss.on('request', function (request) {
    var connection = request.accept('chat', request.origin)
    var name = null

    connection.on('message', function (message) {
        var msgData = JSON.parse(message.utf8Data)
        switch(msgData.option) {
            case "userJoin":
                connection.send('{"option": "test"}')
                
                saveData.users[saveData.length] = {"name": name, "msgHistory": []}
                saveData.length++
                curMsgHistory.push([1])
                //Bot must be spoken to from here
                

                break;

            case "botJoin":
                break;
            
            case "userMsg":
                break;
            
            case "botAnswer":
                break;

            case "reset":
                break;
            
            case "save":
                break;
        }

        if (mySalesBot.connected === false) {
            mySalesBot.connect()
        }
    })
})