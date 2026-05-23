/* Pakete die wir brauchen */

var bot = require('./bot.js')
var express = require('express')

var app = express()

/* Nutzen einer statischen WebSeite
*/
app.use(express.static('public'))

// Wir nutzen ein paar statische Ressourcen
app.use('/css', express.static(__dirname + '/public/css'))
app.use('/js', express.static(__dirname + '/public/js'))
app.use('/images', express.static(__dirname + '/public/images'))

// Wir starten den Express server
var webserver = app.listen(8081, function () {
  var address = webserver.address()
  console.log(address)
  console.log('Server started at http://localhost:8081')
})

// Das brauchen wir für unsere Websockets
var WSS = require('websocket').server
var http = require('http')

var server = http.createServer()
server.listen(8181)               //Ich schätze mal der hier ist 100% unnötig? Weil stattdessen einfach die app verwenden? Die baut ja automatisch auf einen http server auf; der Prof wusste das halt selber safe nicht

// Hier erstellen wir den Server
var wss = new WSS({
  httpServer: server,
  autoAcceptConnections: false
})

/* Wir erstellen einen Bot, der kann sich aber noch nicht mit 
    dem Socket Server verbinden, da dieser noch nciht läuft
*/
var myBot = new bot()
var connections = {}

// Wenn Sich ein client Socket mit dem Server verbinden will kommt er hier an
wss.on('request', function (request) {
  var connection = request.accept('chat', request.origin)

  connection.on('message', function (message) {        //hier bin ich bro
    var name = ''

    for (var key in connections) {
      if (connection === connections[key]) {
        name = key
      }
    }

    var data = JSON.parse(message.utf8Data)
    var msg = 'leer'

    // Variablen um später den letzten Satz und den Sender zu speichern
    var uname
    var utype
    var umsg

    switch (data.type) {
      case 'join':
        // Wenn der Typ join ist füge ich den Client einfach unserer Liste hinzu
        connections[data.name] = connection
        msg = '{"type": "join", "names": ["' + Object.keys(connections).join('","') + '"]}'
        if (myBot.connected === false) {
          myBot.connect()
        }

        break
      case 'msg':
        // Erstelle eine Nachricht in JSON mit Typ, Sender und Inhalt
        msg = '{"type": "msg", "name":"' + name + '", "msg":"' + data.msg + '","sender":"'+data.sender+'"}'
        utype = 'msg'
        uname = name
        umsg = data.msg
        break
    }

    //Sende Daten an alle verbundenen Sockets                      Natürlich auch Teil der Logik
    for (var key in connections) {
      if (connections[key] && connections[key].send) {
        connections[key].send(msg)
      }
    }
    
    // Leite die Daten des Users an den Bot weiter, damit der antworten kann
    if (uname !== 'MegaBot' && utype === 'msg') {
      myBot.post(msg)
    }
  })
})
