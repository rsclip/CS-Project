exports.transition = transition;

const TRANSITIONER = document.getElementById("transitioner");

// play a transition
function transition() {
    TRANSITIONER.classList.add("transition");
    setTimeout(() => {
        TRANSITIONER.classList.remove("transition");
    }, 1500);
}