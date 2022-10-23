exports.displayUsers = displayUsers;

const USERS_LIST = document.getElementById('onlineUsersList');

// Generate the html for a user
function genUserHTML(user) {
    /* Structure:
     <div class="onlineUser" id="user_${user.id}">
        <div class="userDetails">
            <div class="profilePictureContainer"><img class="profilePicture" src="./css/imgs/default_pfp.png" alt="Profile Picture"></div>
            <div class="username">${user.username}</div>
        </div>
    </div>
    */
    let container = document.createElement('div');
    container.classList.add('onlineUser');
    container.id = `user_${user.id}`;

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

    pfpContainer.appendChild(pfp);
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
    console.log("beginning displayUsers with", users);

    // Get all current users
    let currentUsers = USERS_LIST.children;

    // log all user ids
    let currentUsersIDs = [];
    for (let i = 0; i < currentUsers.length; i++) {
        currentUsersIDs.push(currentUsers[i].id);
    }
    console.log(currentUsersIDs);

    // Filter out displayed users which are not in the new list
    for (let i = 0; i < currentUsers.length; i++) {
        let user = currentUsers[i];
        let id = user.id.split('_')[1];
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
    console.log(currentUsersIDs);
    
    console.log("finished displayUsers");
}