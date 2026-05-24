'use strict'

var WebSocketClient = require('websocket').client

class salesBot {
    constructor () {
        this.client = new WebSocketClient()

        this.connected = false

        this.client.on('connectFailed', function (error) {
            console.log('Connect Error: ' + error.toString())
        })

        this.client.on('connect', function (connection) {
            this.con = connection
            connection.send('{"option": "botJoin"}')

            connection.on('error', function (error) {
                console.log('Connection Error: ' + error.toString())
            })

            connection.on('close', function () {
                console.log('echo-protocol Connection Closed')
            })

            connection.on('message', function (message) {
                //AAAAAAAAAAAAAAAAAAAAAAAA
            })
        })
    }

    connect () {                      //Used by staticExpress!
        this.connected = true
        this.client.connect('ws://localhost:8081/', 'chat')
    }
}

module.exports = salesBot