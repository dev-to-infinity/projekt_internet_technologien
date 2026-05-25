'use strict'

var WebSocketClient = require('websocket').client
const wordTree = require('./wordTree.json')

const responder = (msg, msgPath) => {
    var curNode = wordTree               //When JSON file is going to be used this is just gonna be the parsed file which is literally an instance

    for(var keyword in msgPath) curNode = curNode.wordList[msgPath[keyword]]

    for(var keyword in curNode.wordList) if(msg.includes(keyword)) return {"keyword": keyword, "response": curNode.wordList[keyword].response}    //which means if two words from wordList exist as a substring in msg only the first one matters

}

class salesBot {
    

    constructor () {
        this.client = new WebSocketClient()

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
                var msgData = JSON.parse(message.utf8Data)
                switch(msgData.option){
                    case "userMsg":
                        var responseObj = responder(msgData.msg, msgData.msgPath)
                        connection.send(`{"option": "botAnswer", "msg": "${responseObj.response}", "name": "${msgData.name}", "newKeyword": "${responseObj.keyword}"}`)
                        break;
                    case "firstUserMsg":
                        connection.send(`{"option": "firstBotAnswer", "name": "${msgData.name}", "msg": "${wordTree.response}"}`)
                        break;
                }
            })
        })
    }

    connect () {                      //Used by staticExpress!
        this.client.connect('ws://localhost:8081/', 'chat')
    }
}

module.exports = salesBot