'use strict'

class msgPrinter {
    msger_chat = document.getElementById('msger-chat')

    createMsg(side, name, pfp, msg, timestamp) {
        const msg = `
            <div class="msg ` + side + `-msg">
                <div class="msg-img" style="background-image: url(` + pfp + `)"></div>

                <div class="msg-bubble">
                    <div class="msg-info">
                    <div class="msg-info-name">` + name + `</div>
                    <div class="msg-info-time">` + timestamp + `</div>
                    </div>

                    <div class="msg-text">`
                    + msg +
                    `</div>
                </div>
                </div>
        `

        return msg
    }

    left(msg, timestamp) {
        this.createMsg("left", "SalesBot", "../img/customer-service.webp", msg, timestamp)
    }

    right(name, msg, timestamp) {
        this.msger_chat.append(this.createMsg("right", name, "../img/user-pfp.jpeg", msg, timestamp))
    }
}

module.exports = msgPrinter