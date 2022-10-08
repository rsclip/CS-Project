/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

var connection = require("./js/connection.js");

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
function connect() {
    // get hostname and port
    let hostname = document.getElementById("hostname").value;
    let port = document.getElementById("port").value;

    // if the pair are valid...
    let [valid, result] = connection.isValid(hostname, port);
    console.log(valid, result);
    if (valid) {
        // connect to the server
        testVar = port;
        
    } else {
        // display an error
        connection.displayError(result);
    }

    displayPage("idk");
}
