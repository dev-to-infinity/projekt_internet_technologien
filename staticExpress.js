var salesBot = require('./salesBot')
var express = require('express')
var http = require('http')
var WSS = require('websocket').server

var firstMsg = "Welcome! To start, please choose a username that I can remember u by. Or remind me of who you are if we talked before!"

try {
    require('Node:fs')
    console.log("hell yeah")
} catch (err) {console.log("shiii")}

var curHistory = {
    "SalesBot": {connection: null}
}                //Because it should not automatically be saved, or when any user clicks save, but when the SPECIFIC user clicks save; null element for bot

var saveData = {}

try {
    var save = fs.readFileSync('C:/serversideSaveFile', 'utf8')
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

        switch(msgData.option) {
            case "userJoin":
                name = msgData.name
                if(name in saveData) {              //in looks for indices, not values!
                    curHistory[name] = {"msgHitory": saveData.users[name].msgHistory, "msgPath": saveData.users[name].msgPath, "connection": connection}
                    connection.send(`{"option": "userJoin", "name": "${name}", "msgPath": ${saveData[name].msgPath}}`)
                }
                else {
                    curHistory[msgData.name] = {"msgHistory": [firstMsg, name], "msgPath": [], "connection": connection}
                    curHistory["SalesBot"].connection.send(`{"option": "firstUserMsg", "name": "${name}"}`)
                }                

                break;

            case "botJoin":
                name = "SalesBot"
                curHistory["SalesBot"].connection = connection
                console.log("Bot successfully joined")
                break;
            
            case "userMsg":
                curHistory["SalesBot"].connection.send(`{"option": "userMsg", "name": "${name}", "msg": "${msgData.msg}", "msgPath": ${JSON.stringify(curHistory[name].msgPath)}}`)
                //JSON.stringify() was used because of the problems an empty array causes in ${}, as it completely vanishes
                break;
            
            case "botAnswer":
                curHistory[msgData.name].msgHistory.push(msgData.msg)
                curHistory[msgData.name].msgPath.push(msgData.newKeyword)
                curHistory[msgData.name].connection.send(`{"option": "botAnswer", "msg": "${msgData.msg}"}`)
                break;
            
            case "firstBotAnswer":
                curHistory[msgData.name].msgHistory.push(msgData.msg)
                curHistory[msgData.name].connection.send(`{"option": "botAnswer", "msg": "${msgData.msg}"}`)
                break;
            
            case "reset":
                break;
            
            case "save":
                break;
        }
    })
})