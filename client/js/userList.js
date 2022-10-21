exports.displayUsers = displayUsers;

const USERS_LIST = document.getElementById('onlineUsersList');

/** Display a list of online users
 * User object structure:
 * {
 *      username: string,
 *            id: string,
 * }
 */
function displayUsers(users) {
    // Sort users by username
    users.sort((a, b) => {
        if (a.username < b.username) {
            return -1;
        } else if (a.username > b.username) {
            return 1;
        } else {
            return 0;
        }
    });

    // Build new innerHTML
    let html = '';
    users.forEach((user) => {
        html += `<div class="onlineUser" id="user_${user.id}">
            <div class="userDetails">
                <div class="profilePictureContainer"><img class="profilePicture" src="./css/imgs/default_pfp.png" alt="Profile Picture"></div>
                <div class="username">${user.username}</div>
            </div>
        </div>`;
    });

    // Set innerHTML
    USERS_LIST.innerHTML = html;
}