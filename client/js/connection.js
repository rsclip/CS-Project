exports.isValid = isValid;
exports.displayError = displayError;

/**
 * Displays an error onscreen
 * @param {string} msg 
 */
function displayError(msg) {
    let error = document.getElementById("connectionError");
    let errorMsg = document.getElementById("errorMsg");

    error.classList.remove("hidden");
    errorMsg.innerText = msg;
}

/**
 * Checks if a hostname and port are valid
 * @param {string} hostname
 * @param {string} port
*/
function isValid(hostname, port) {
    // check if hostname is valid
    if (hostname.length < 1) {
        // return false and reason
        return [false, "Hostname is too short"];
    }

    // check if port is valid
    if (port.length < 1) {
        return [false, "Port is too short"];
    }

    // is port a number under 65535?
    if (isNaN(port) || port > 65535) {
        return [false, "Port is not a number or is over 65535"];
    }

    return [true, "success"];
}