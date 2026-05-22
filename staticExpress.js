var bot = require('./bot.js')
var express = require('express')
var http = require('http')
var WSS = require('websocket').server

var saveData = 
{
    "lowestFreeUID": 1,
    "users": 
    [
        {"name": "Megabot", "connection": null}
    ] 
}

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

var webserver = app.listen(8081, () => {                                     //you dont need the extra http server the prof used in his example cuz staticExpress uses one automatically!
  var address = webserver.address()
  console.log(address)
  console.log('Server started at http://localhost:8081')
})

var wss = new WSS({
  httpServer: webserver,
  autoAcceptConnections: false
})

var salesBot = new bot()
var connections = {}

wss.on('request', function (request) {
    var connection = request.accept('chat', request.origin)

    connection.on('message', function (message) {
        var data = JSON.parse(message.utf8Data)

        if(data.neu === true) {}
    })
})