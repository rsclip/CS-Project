class Chat {
    constructor(messageList) {
        this.messageList = messageList;
        this.targetPublicKey = null;
        this.targetUsername = null;
        this.targetID = null;
    }
}

// ==================== EXPORTS ====================
exports.Chat = Chat;