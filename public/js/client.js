var socket = new WebSocket('ws://192.168.178.21:8181/', 'chat')
const fs = require('node:fs')

socket.onopen = function () {
    try {
        const uID = fs.readFileSync('C:/mySaveFile', 'utf8')
        socket.send('{"neu": false, "uID": ' + uID + '}')
    } 
    catch (err) {
        socket.send('{"neu": true, "uID": -1}')
    }

    
}