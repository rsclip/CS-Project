exports.displayError = displayError;

/**
 * Displays an error onscreen
 * @param {string} msg 
 */
 function displayError(msg) {
    let error = document.getElementById("loginError");
    let errorMsg = document.getElementById("loginErrorMsg");

    error.classList.remove("hidden");
    errorMsg.innerText = msg;
}