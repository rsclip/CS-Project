'use strict';

const connection = require("./js/connection.js");
const keys = require("./js/keys.js");
const io = require("socket.io-client");


let isConnected = false;
const { publicKey, privateKey } = keys.getKeyPairs();
let serverPublicKey = null;


document.getElementById("connect").addEventListener("click", connect);

function displayPage(page) {
    // get all pages within the .page class and hide all
    document.querySelectorAll(".page").forEach(function(el) {
        el.style.display = "none";
    });

    // unhide the current page id
    document.getElementById(page).style.display = "block";
}

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
    let socket = io.connect(`http://${hostname}:${port}`);
    console.log("Trying to connect to server...");

    socket.on("error", function(err) {
        console.log(err);
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
        }

        console.log(serverPublicKey);

        // try to send a message
        try {
            let message = keys.encrypt(serverPublicKey, "Hello from client");
            socket.emit("message", message);
            console.log("Sent encrypted message to server", message);
        } catch (err) {
            console.log(err);
        }
    });

    // wait until the connection is established and send a message
    await new Promise((resolve, reject) => {
        socket.once("connect", () => {
            console.log("Connected to server!");

            // send our public key to the server
            socket.emit("sendPublicKey", publicKey);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
            socket.disconnect();
            resolve();
        });

    }).catch((err) => {
        console.log(err);
        connection.displayError(err + "; check your hostname and port.");
        reject();
    });
}

// ====================== CONNECTIONS END ====================== //