'use strict'

var WebSocketClient = require('websocket').client
const wordTree = require('./wordTree.json')

const responder = (msg, msgPath, rotation, userInstruction) => {
    var curNode = wordTree               //When JSON file is going to be used this is just gonna be the parsed file which is literally an instance

    for(var i in msgPath) curNode = curNode.nextNodes[msgPath[i]]

    switch(userInstruction){
        case "none":
            for(var nodeIndex in curNode.nextNodes) for(var keywordIndex in curNode.nextNodes[nodeIndex].keywords){
                if(msg.includes(curNode.nextNodes[nodeIndex].keywords[keywordIndex])){
                    return {"result": "hit", "nodeIndex": nodeIndex, "msg": curNode.nextNodes[nodeIndex].response, "userInstruction": curNode.nextNodes[nodeIndex].userInstruction, "serverInstruction": curNode.nextNodes[nodeIndex].serverInstruction}
                }    //which means if two words from wordList exist as a substring in msg only the first one matters
            } 
            break;

        case "expectNumber":
            var number = Number(msg)
            if(!isNaN(number)) return {"result": "hit","nodeIndex": 0, "msg": curNode.nextNodes[0].response, "userInstruction": curNode.nextNodes[0].userInstruction, "serverInstruction": curNode.nextNodes[0].serverInstruction, "value": number}
            break;
    }

    return {"result": "miss", "msg": wordTree.rootDefaults[rotation % wordTree.rootDefaults.length] + " " + curNode.defaults[rotation % curNode.defaults.length]}
    
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
                        var responseObj = responder(msgData.msg, msgData.msgPath, msgData.rotation, msgData.userInstruction)
                        responseObj.name = msgData.name
                        responseObj.option = "botAnswer"
                        connection.send(JSON.stringify(responseObj))
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