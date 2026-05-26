'use strict'

var WebSocketClient = require('websocket').client
const wordTree = require('./wordTree.json')

const responder = (msg, msgPath, rotation) => {
    var curNode = wordTree               //When JSON file is going to be used this is just gonna be the parsed file which is literally an instance

    console.log("msgPath: ", msgPath)

    for(var i in msgPath) curNode = curNode.nodeList[msgPath[i]]

    console.log(curNode)
    console.log("Trenner")

    for(var nodeIndex in curNode.nodeList) for(var keywordIndex in curNode.nodeList[nodeIndex].keywords) if(msg.includes(curNode.nodeList[nodeIndex].keywords[keywordIndex])) return {"match": true, "nodeIndex": nodeIndex, "response": curNode.nodeList[nodeIndex].response, "specialCase": curNode.nodeList[nodeIndex].specialCase}    //which means if two words from wordList exist as a substring in msg only the first one matters

    return {"match": false, "response": wordTree.rootDefaults[rotation % wordTree.rootDefaults.length] + " " + curNode.defaults[rotation % curNode.defaults.length]}
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
                        var responseObj = responder(msgData.msg, msgData.msgPath, msgData.rotation)
                        if(responseObj.match) connection.send(`{"option": "botAnswer", "result": "hit", "msg": "${responseObj.response}", "name": "${msgData.name}", "nodeIndex": "${responseObj.nodeIndex}"}`)
                        else connection.send(`{"option": "botAnswer", "result": "miss", "name": "${msgData.name}", "msg": "${responseObj.response}"}`)
                        break;
                    case "firstUserMsg":
                        connection.send(`{"option": "botAnswer", "result": "first", "name": "${msgData.name}", "msg": "${wordTree.response}"}`)
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