var salesBot = require('./salesBot')
var express = require('express')
var http = require('http')
var WSS = require('websocket').server

var firstMsg = "Welcome! To start, please choose a username that I can remember u by. Or remind me of who you are if we talked before!"

try {
    require('Node:fs')
    console.log("hell yeah")
} catch (err) {console.log("shiii")}

var curHistory = []                //Because it should not automatically be saved, or when any user clicks save, but when the SPECIFIC user clicks save; null element for bot

var saveData = 
{
    "users": []
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

var arr = []

var wss = new WSS({
  httpServer: webserver,
  autoAcceptConnections: false
})

var mySalesBot = new salesBot()
var connections = {}

wss.on('request', function (request) {                      //Dont base your logic on the connection! It doesn't survive over multiple sessions and the entire block exists separately for each request/user including the bot!
    var connection = request.accept('chat', request.origin)
    var name = null

    connection.on('message', function (message) {
        var msgData = JSON.parse(message.utf8Data)
        console.log(msgData)
        switch(msgData.option) {
            case "userJoin":
                name = msgData.name
                if(name in saveData.users) {              //in looks for indices, not values!
                    connection.send(`{"option": "userJoin", "msgHistory": ${saveData.users[name].msgHistory}`)
                    curHistory[name] = {"msgHitory": saveData.users[name].msgHistory, "msgPath": saveData.users[name].msgPath}
                }
                else {
                    curHistory[msgData.name] = {"msgHistory": [firstMsg, name], "msgPath": []}
                    //Bot must be spoken to from here AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                }                

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