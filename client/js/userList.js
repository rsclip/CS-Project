const USERS_LIST = document.getElementById('onlineUsersList');

// Generate the html for a user
function genUserHTML(user) {
    /* Structure:
     <div class="onlineUser" id="user_${user.id}">
        <div class="userDetails">
            <div class="profilePictureContainer">
                <img class="profilePicture" src="./css/imgs/default_pfp.png" alt="Profile Picture">
                <div class="badge"></div>
            </div>
            <div class="username">${user.username}</div>
        </div>
    </div>
    */
    let container = document.createElement('div');
    container.classList.add('onlineUser');
    container.id = `user_${user.id}`;
    container.dataset.username = user.username;
    container.dataset.id = user.id;

    let details = document.createElement('div');
    details.classList.add('userDetails');

    let pfpContainer = document.createElement('div');
    pfpContainer.classList.add('profilePictureContainer');

    let pfp = document.createElement('img');
    pfp.classList.add('profilePicture');
    pfp.src = './css/imgs/default_pfp.png';
    pfp.alt = 'Profile Picture';

    let username = document.createElement('div');
    username.classList.add('username');
    username.innerText = user.username;

    let badge = document.createElement('div');
    badge.classList.add('badge');

    pfpContainer.appendChild(pfp);
    pfpContainer.appendChild(badge);
    details.appendChild(pfpContainer);
    details.appendChild(username);
    container.appendChild(details);

    return container;
}

/** Display a list of online users
 * User object structure:
 * {
 *      username: string,
 *            id: string,
 * }
 */
function displayUsers(users) {
    // Sort users by username
    // users.sort((a, b) => {
    //     if (a.username < b.username) {
    //         return -1;
    //     } else if (a.username > b.username) {
    //         return 1;
    //     } else {
    //         return 0;
    //     }
    // });

    // Get all current users
    let currentUsers = USERS_LIST.children;

    // get all user ids
    let currentUsersIDs = [];
    for (let i = 0; i < currentUsers.length; i++) {
        currentUsersIDs.push(currentUsers[i].id);
    }

    // Filter out displayed users which are not in the new list
    for (let i = 0; i < currentUsers.length; i++) {
        let user = currentUsers[i];
        let id = user.getAttribute("data-id");
        if (!users.find((user) => user.id === id)) {
            user.remove();
        }
    }

    // Add new users
    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        if (!currentUsersIDs.includes(`user_${user.id}`)) {
            USERS_LIST.appendChild(genUserHTML(user));
        }
    }

    for (let i = 0; i < currentUsers.length; i++) {
        currentUsersIDs.push(currentUsers[i].id);
    }
}


// add unread message badge to user
function addUnreadMessageBadge(username) {
    let user = document.querySelector(`[data-username="${username}"]`);
    let badge = user.querySelector('.badge');
    badge.classList.add('active');
}

// remove unread message badge from user
function removeUnreadMessageBadge(username) {
    let user = document.querySelector(`[data-username="${username}"]`);
    let badge = user.querySelector('.badge');
    badge.classList.remove('active');
}

// ======================== EXPORTS ========================
exports.displayUsers = displayUsers;
exports.addUnreadMessageBadge = addUnreadMessageBadge;
exports.removeUnreadMessageBadge = removeUnreadMessageBadge;