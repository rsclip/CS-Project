'use strict';

const fs = require('fs');

const connection = require("./js/connection.js");
const accounts = require("./js/accounts.js");
const keys = require("./js/keys.js");
const { transition } = require("./js/transitioner.js");
const messaging = require("./js/messaging.js");
const userList = require("./js/userList.js");
const conversations = require("./js/conversations.js");

const io = require("socket.io-client");
const { webFrame } = require('electron')

webFrame.setZoomFactor(1.08);

// Our public & private key
const { publicKey, privateKey } = keys.getKeyPairs();

// Determines whether a user is connected to a server
let isConnected = false;
// Whether the user is authenticated to a server
let isAuthenticated = false;
// Current username authenticated as
let currentUsername = null;
// Current connected server's public key
let serverPublicKey = null;
// Message Authentication Code (MAC) for the current session
let MAC = null;
// Socket for the server
let socket = null;

// A list of all online users
let onlineUsers = [];
// A list of messages
let messageList = new messaging.MessageList();
// The chat object for a specific conversation
let chat = new conversations.Chat(messageList);


// Function to display a page
function displayPage(page) {
    transition();
    setTimeout(() => {
        // get all pages within the .page class and hide all
        document.querySelectorAll(".page").forEach(function(el) {
            el.classList.add("hidden");
        });

        // unhide the current page id
        document.getElementById(page).classList.remove("hidden");
    }, 900);
}


document.getElementById("connect").addEventListener("click", connect);

/**
 * Connect to the server based on
 * a hostname and port (if provided)
 * 
 * @param {string} hostname
 * @param {string} port
 * @returns {void}
*/
async function connect() {
    console.log("Connect function called");
    // get hostname and port
    let hostname = document.getElementById("hostname").value;
    let port = document.getElementById("port").value;

    // if the pair are valid...
    let [valid, result] = connection.isValid(hostname, port);
    console.log(valid, result);
    if (valid && !isConnected && document.getElementById("connect").disabled == false) {
        // disable button
        document.getElementById("connect").disabled = true;
        document.getElementById("connect").innerText = "Connecting...";

        // connect to the server
        await initiateConnection(hostname, port);

        // enable button
        document.getElementById("connect").disabled = false;
        document.getElementById("connect").innerText = "Connect";
        
    } else {
        // display an error
        connection.displayError(result);
    }
}

// ======================== CONNECTIONS ======================== //
/** This will initiate a connection to the server.
 * It works by first trying to connect to the server
 * and setting up all socket events. Once the connection
 * is established, it will then send the public key to
 * the server to be stored.
 * 
 * @param {string} hostname
 * @param {string} port
 * @returns {void}
*/
async function initiateConnection(hostname, port) {
    console.log("Called initiateConnection");
    // connect to the server
    socket = io.connect(`http://${hostname}:${port}`);
    console.log("Trying to connect to server...");

    // ------ UNENCRYPTED EVENTS ------
    socket.on("error", function(err) {
        console.error(err);
        connection.displayError(err);
    });

    socket.on("message", function(data) {
        console.log("data from server", data);
        console.log("decrypted", keys.decrypt(privateKey, data));
    });



    // on sendPublicKey event
    socket.on("sendPublicKey", function(data) {
        console.log("Received public key from server");

        try {
            // try to parse the public key
            serverPublicKey = keys.parsePublicKey(data);
            console.log("Server public key:", serverPublicKey);
        } catch(err) {
            // if it fails, display an error
            connection.displayError("Failed to parse server public key");
            console.error("Failed to parse server public key:", err);
            return;
        }

        console.log(serverPublicKey);

        // Send public key
        socket.emit("sendPublicKey", publicKey);
    });




    // ------- ENCRYPTED EVENTS ------
    // on sendMac event
    socket.on("sendMac", function(data) {
        console.log("Received MAC from server");
        try {
            // try to decrypt the MAC
            MAC = keys.decrypt(privateKey, data);
            console.log("MAC:", MAC);
            
            // connection fully initiated, display accounts page
            displayPage("accounts");
            isConnected = true;
        } catch(err) {
            // if it fails, display an error
            connection.displayError("Failed to decrypt MAC");
            console.error("Failed to decrypt MAC:", err);
            return;
        }
    });



    // on login event
    socket.on("login", function(data) {
        console.log("Received login data from server");
        try {
            // try to decrypt the data
            let decrypted = keys.decryptObject(privateKey, data);
            console.log(decrypted);

            // Check if successful or not
            // Format: {success: true/false, message: "message", username: "optional username"}
            if (decrypted.success) {
                // if successful, display chat page and update online users
                console.log("Login successful");
                handleLogin(decrypted.username);
            } else {
                // if not, display an error
                console.log("Login failed: ", decrypted.message);
                accounts.displayError(decrypted.message);

                // reset connection UI
                resetConnectionUI();
            }
        } catch(err) {
            // if it fails, display an error
            connection.displayError("Failed to decrypt login data");
            console.error("Failed to decrypt login data:", err);
            return;
        }
    });



    // on register event
    socket.on("register", function(data) {
        console.log("Received register data from server");
        try {
            // try to decrypt the data
            let decrypted = keys.decryptObject(privateKey, data);
            console.log(decrypted);

            // Check if successful or not
            // Format: {success: true/false, message: "username"}
            if (decrypted.success) {
                // if successful, display chat page and update online users
                console.log("Register successful");
                handleLogin(decrypted.username);
            } else {
                // if not, display an error
                console.log("Register failed: ", decrypted.message);
                accounts.displayError(decrypted.message);

                // reset connection UI
                resetConnectionUI();
            }
        } catch(err) {
            // if it fails, display an error
            connection.displayError("Failed to decrypt register data");
            console.error("Failed to decrypt register data:", err);
            return;
        }
    });



    // on onlineUsers event
    socket.on("onlineUsers", function(data) {
        try {
            // try to decrypt the data
            let decrypted = keys.decryptObject(privateKey, data);

            // get users object
            onlineUsers = decrypted.users;

            // update online users
            userList.displayUsers(onlineUsers);
        } catch(err) {
            console.error("Failed to decrypt online users:", err);
        }
    });


    // on loadMessage event
    socket.on("loadMessage", function(data) {
        try {
            // try to decrypt the data
            let decrypted = keys.decryptObject(privateKey, data);

            // get message
            let message = decrypted.message;
            
            // decrypt message using own private key
            let messageDecrypted = keys.decrypt(privateKey, message);

            // remove start and end quotes
            messageDecrypted = messageDecrypted.substring(1, messageDecrypted.length - 1);

            console.log("Received message:", messageDecrypted);

            // if sender is current the target user (active chat), add message to chat
            if (decrypted.from == chat.targetUsername) {
                messaging.addMessage(messageList, messageDecrypted, "incoming");
            } else {
                // if not add to backlog
                messaging.addMessageToBacklog(decrypted.from, messageDecrypted);

                // update unread messages
                userList.addUnreadMessageBadge(decrypted.from);
            }
        } catch(err) {
            console.error("Failed to decrypt messages:", err);
        }
    });


    // on messageResult event
    socket.on("messageResult", function(data) {
        try {
            // try to decrypt the data
            let decrypted = keys.decryptObject(privateKey, data);

            // get message
            let message = decrypted.message;

            // decrypt message using own private key
            let messageDecrypted = keys.decrypt(privateKey, message);

            // remove start and end quotes
            messageDecrypted = messageDecrypted.substring(1, messageDecrypted.length - 1);

            console.log("Received message result:", messageDecrypted);

            // add message to chat
            messaging.addMessage(messageList, messageDecrypted, "outgoing");
        } catch(err) {
            console.error("Failed to decrypt messages:", err);
        }
    });


    // wait until the connection is established and send a message
    await new Promise((resolve, reject) => {
        socket.once("connect", () => {
            console.log("Connected to server!");
            isConnected = true;
            isAuthenticated = false;
            currentUsername = null;

            // ping for online users list every second
            // only if the user is authenticated
            setInterval(() => {
                updateOnlineUserList();
            }, 1000);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
            isConnected = false;
            isAuthenticated = false;
            currentUsername = null;
            socket.disconnect();
            displayPage("connection");
            resolve();
        });

    }).catch((err) => {
        console.log(err);
        connection.displayError(err + "; check your hostname and port.");
        reject();
    });
}

function updateOnlineUserList() {
    if (isAuthenticated) {
        // payload
        let payload = {
            MAC: MAC,
            data: {}
        };

        // encrypt payload
        let encrypted = keys.encryptObject(serverPublicKey, payload);
        socket.emit("onlineUsers", encrypted);
    }
}

function resetConnectionUI() {
    // re-enable all buttons
    document.getElementById("submitLogin").disabled = false;
    document.getElementById("submitRegister").disabled = false;

    // reset all input fields
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("registerUsername").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("registerConfirmPassword").value = "";
}

function updateUsername(username) {
    currentUsername = username;
    document.getElementById("username").innerHTML = username;
    console.log("Updated username to", username);
}

function handleLogin(username) {
    displayPage("chat");
    isAuthenticated = true;
    updateUsername(username);
    updateOnlineUserList();
    resetConnectionUI();
}

// ====================== CONNECTIONS END ====================== //




// ======================== ACCOUNTS ======================== //
document.getElementById("loginTab").addEventListener("click", function() {
    document.getElementById("loginTab").classList.add("active");
    document.getElementById("registerTab").classList.remove("active");
    document.getElementById("login").classList.remove("hidden");
    document.getElementById("register").classList.add("hidden");
});


document.getElementById("registerTab").addEventListener("click", function() {
    document.getElementById("loginTab").classList.remove("active");
    document.getElementById("registerTab").classList.add("active");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("register").classList.remove("hidden");
});



document.getElementById("submitLogin").addEventListener("click", function(e) {
    let username = document.getElementById("usernameLogin").value;
    let password = document.getElementById("passwordLogin").value;

    // Get encrypted payload to send
    let payload = keys.encryptObject(
        serverPublicKey,
        {
            MAC: MAC,
            data: {
                username: username,
                password: password
            }
        }
    );

    console.log("Sending login data to server", payload);

    // Send payload
    socket.emit("login", payload);

    // disable button
    document.getElementById("submitLogin").disabled = true;
});



document.getElementById("submitRegister").addEventListener("click", function(e) {
    let username = document.getElementById("usernameRegister").value;
    let password = document.getElementById("passwordRegister").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    // Check if passwords match
    if (password !== confirmPassword) {
        accounts.displayError("Passwords do not match");
        return;
    }

    // Get encrypted payload to send
    let payload = keys.encryptObject(
        serverPublicKey,
        {
            MAC: MAC,
            data: {
                username: username,
                password: password
            }
        }
    );

    console.log("Sending register data to server", payload);

    // Send payload
    socket.emit("register", payload);
    
    // disable button
    document.getElementById("submitRegister").disabled = true;
});

// ====================== ACCOUNTS END ====================== //




// ======================== CHAT ======================== //
const chat_messageInput = document.getElementById("messageInput");
const chat_sendMessage = document.getElementById("sendMessage");

chat_messageInput.addEventListener("keyup", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

chat_sendMessage.addEventListener("click", function(e) {
    sendMessage();
});



// onClick event for onlineUser
document.body.addEventListener('click', function (evt) {
    const el = evt.target;
    const closest = el.closest('.onlineUser');
    
    try {
        if (closest.contains(el)) {
            const username = closest.getAttribute("data-username");
            const id = closest.getAttribute("data-id");
            selectUser(username, id);
        }
    } catch (err) {
        // do nothing
    }
}, false);


// Called when a user is selected (from the online users list)
async function selectUser(username, id) {
    // Get the target's public key
    let targetPublicKey = await getTargetPublicKey(username, id);
    console.log("Target public key:");
    console.log(targetPublicKey);

    // Set the target's data
    chat.setTarget(keys.parsePublicKey(targetPublicKey), username, id);

    // get the user element clicked on
    let userElement = document.querySelector(`[data-username="${username}"][data-id="${id}"]`);

    // remove the selected class from all users
    let onlineUsers = document.getElementsByClassName("onlineUser");
    for (let i = 0; i < onlineUsers.length; i++) {
        onlineUsers[i].classList.remove("active");
    }

    // add the selected class to the user clicked on
    userElement.classList.add("active");

    // update the chat title
    document.getElementById("currentUser").innerHTML = username;

    // clear the chat
    chat.clear();
    console.log("Cleared chat");

    // read from backlogs
    messaging.readFromBacklog(messageList, username);

    // clear unread badge
    userList.removeUnreadMessageBadge(username);

    console.log("Selected user", username, id);
}


async function getTargetPublicKey(username, id) {
    // check if cached
    const path = `./keys/${username}_${id}.pub`;
    if (fs.existsSync(path)) {
        return keys.loadCachedPublicKey(path);
    } else {
        // request public key from server
        let payload = keys.encryptObject(
            serverPublicKey,
            {
                MAC: MAC,
                data: {
                    username: username
                }
            }
        );

        socket.emit("userPublicKey", payload);
        console.log("Requested public key for", username, id);

        // wait for response
        return new Promise((resolve, reject) => {
            socket.on("userPublicKey", (data) => {
                let decrypted = keys.decryptObject(privateKey, data);

                if (decrypted.success) {
                    resolve(decrypted.publicKey);
                } else {
                    reject(`Failed to get public key for ${username}: ${decrypted.message}`);
                }
            });
        });
    }
}


function sendMessage() {
    let message = chat_messageInput.value;

    // check if message is empty
    if (message === "") {
        return;
    }

    // encrypt message with target's public key
    let encrypted = keys.encryptObject(chat.targetPublicKey, message);

    console.log("Encrypted message:", encrypted);

    // send message, encrypted with server's public key
    let payload = keys.encryptObject(
        serverPublicKey,
        {
            MAC: MAC,
            data: {
                message: encrypted,
                username: chat.targetUsername,
                id: chat.targetId
            }
        }
    );

    console.log("Sending message to server", payload);

    socket.emit("message", payload);

    // clear input
    chat_messageInput.value = "";
}