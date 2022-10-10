'use strict';

var connection = require("./js/connection.js");
const io = require("socket.io-client");

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
    // get hostname and port
    var hostname = document.getElementById("hostname").value;
    var port = document.getElementById("port").value;

    // if the pair are valid...
    var [valid, result] = connection.isValid(hostname, port);
    console.log(valid, result);
    if (valid) {
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

async function initiateConnection(hostname, port) {
    // connect to the server
    var socket = io.connect(`http://${hostname}:${port}`);
    console.log("Trying to connect to server...");

    // wait until the connection is established with promises
    // if not, return an error with connection.displayError
    // then send and receive a message from the server

    // wait until the connection is established
    await new Promise((resolve, reject) => {
        socket.on("connect", function() {
            console.log("Connected to server!");
            resolve();
        });

        socket.on("connect_error", function(err) {
            reject("Connection error");
            // log error
            console.log(err);
            connection.displayError(err + "; check your hostname and port.");
        });
    }
    ).then(() => {
        // display the main page
        displayPage("main");

        // send a message to the server
        socket.emit("message", "Hello from the client!");

        // wait for a message from the server
        socket.on("message", function(msg) {
            console.log(msg);
        });

    }).catch((err) => {
        // display an error
        connection.displayError(err + "; check your hostname and port.");
    });
}

// ====================== CONNECTIONS END ====================== //