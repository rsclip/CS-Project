const MESSAGES = document.getElementById("messageList");

class Chat {
    constructor(messageList) {
        this.messageList = messageList;
        this.targetPublicKey = null;
        this.targetUsername = null;
        this.targetID = null;
    }

    // Set the target of the chat
    setTarget(targetPublicKey, targetUsername, targetID) {
        this.targetPublicKey = targetPublicKey;
        this.targetUsername = targetUsername;
        this.targetID = targetID;
    }

    // Clear chat
    clear() {
        this.messageList.clear();
        MESSAGES.innerHTML = '';
    }
}

// ==================== EXPORTS ====================
exports.Chat = Chat;