var salesBot = require('./salesBot')
var express = require('express')
var http = require('http')
var WSS = require('websocket').server
var fs = require('node:fs')

var firstMsg = "Welcome! To start, please choose a username that I can remember u by. Or remind me of who you are if we talked before!"
var rotationModule = 1000

var curHistory = {
    "SalesBot": {connection: null}
}                //Because it should not automatically be saved, or when any user clicks save, but when the SPECIFIC user clicks save; null element for bot

var saveData = {}
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

        switch(msgData.option) {
            case "userJoin":
                name = msgData.name
                if(name in saveData) {              //in looks for indices, not values!
                    console.log("we are here")
                    curHistory[name] = {"msgHitory": saveData[name].msgHistory, "msgPath": saveData[name].msgPath, "rotation": saveData[name].rotation, "userInstruction": saveData[name].userInstruction, "connection": connection}
                    connection.send(`{"option": "userJoin", "msgHistory": ${JSON.stringify(saveData[name].msgHistory)}}`)
                    console.log("sent")
                }
                else {
                    curHistory[name] = {"msgHistory": [firstMsg, name], "msgPath": [], "rotation": 0, "userInstruction": "none", "connection": connection}
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
                //JSON.stringify() was used because of the problems an empty array causes in ${}, as it completely vanishes
                break;
            
            case "botAnswer":
                console.log("What was received: ", msgData)
                switch(msgData.result){
                    case "hit":
                        curHistory[msgData.name].msgPath.push(msgData.nodeIndex)
                        curHistory[msgData.name].userInstruction = msgData.userInstruction    //AAAAAAAAAAAAAAAAAAAAAAAA verändern!
                        console.log("what's in curHistory: ", curHistory[msgData.name].userInstruction)
                        switch(msgData.serverInstruction){
                            case "initPendingOrder":
                                break;
                            case "cancelOrder":
                                break;
                            //AAAAAAAAAAAAAAAAAA wie veränderst du specialCase? Du musst das auf serverInstruction und userInstruction umverändern oder so
                        }
                        break;
                    
                    case "miss":
                        curHistory[msgData.name].rotation = curHistory[msgData.name].rotation + 1 % rotationModule
                        break;
                    
                    case "first":
                        break;
                }
                curHistory[msgData.name].msgHistory.push(msgData.msg)
                curHistory[msgData.name].connection.send(`{"option": "answer", "msg": "${msgData.msg}"}`)
                break;

            case "reset":
                break;
            
            case "save":
                var toBeSaved = Object.assign({}, curHistory[name])
                delete toBeSaved['connection']
                saveData[name] = toBeSaved
                var msg = ""
                console.log(saveData)
                var worked = true
                fs.writeFile('./saveFile.txt', JSON.stringify(saveData), (err) => {
                    worked = false
                    msg = "Apologies, but the server could currently not save your chat status."
                    console.log(err)
                })
                if(worked) msg = "Chat saved successfully."
                curHistory[name].connection.send(`{"option": "answer", "msg": "${msg}"}`)
                break;
        }
    })
})