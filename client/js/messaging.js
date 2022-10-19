// Manages messaging systems

// Object representing a single message
class Message {
    constructor(message, type, ID) {
        this.message = message;
        this.type = type;
        this.ID = ID;
    }

    create() {
        // create the message element
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", this.type);
        messageElement.id = this.ID;

        // create the message content element
        const messageContent = document.createElement("div");
        messageContent.classList.add("messageContent");
        messageContent.innerText = this.message;

        // append the message content to the message element
        messageElement.appendChild(messageContent);

        // insert to the top of message list
        MESSAGES.insertBefore(messageElement, MESSAGES.firstChild);
    }

    // Delete the message visibly
    delete() {
        let el = this.getMessageElement();
        el.classList.add("deleted");
        el.children[0].innerHTML = '';
        this.message = '';
    }

    getMessageElement() {
        return document.getElementById(this.ID);
    }
}

// Message queue structure
class MessageList {
    constructor() {
        this.messages = [];
    }

    // Add a message to the queue
    addMessage(message) {
        this.messages.push(message);
    }

    // Pop a message based on its ID
    popMessage(ID) {
        this.messages = this.messages.filter((message) => message.ID !== ID);
    }

    // Visibly delete the message
    deleteMessage(ID) {
        this.getID(ID).delete();
    }

    // Get message by ID
    getID(ID) {
        return this.messages.find((message) => message.ID === ID);
    }

    // Get the next message in the queue
    getMessages() {
        return this.messages;
    }

    // Clear
    clear() {
        this.messages = [];
    }
}

const MESSAGES = document.getElementById("messageList");
let messages = new MessageList();

// Generate a random string of length 16
function genMessageID() {
    return Math.random().toString(36);
}

/* Add a message to the message list
 * Code: 
 * <div class="message outgoing">
        <div class="messageContent">Content</div>
    </div>
 * 
 * @param {string} message - The message to add
 * @param {boolean} outgoing - Whether the message is outgoing or not
 * @returns {void}
**/
function addMessage(message, msgType) {
    const msgTypeClass = msgType === "outgoing" ? "outgoing" : "incoming";
    const msgID = genMessageID();
    console.log(msgID);

    let msg = new Message(message, msgType, msgID);
    msg.create();

    messages.addMessage(msg)
    return msgID;
}

// ==== EXPORTS ==== //
exports.addMessage = addMessage;
exports.messages = messages;