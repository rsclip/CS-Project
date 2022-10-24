class Session:
    """Represents a session with a client"""
    def __init__(self, sid):
        self.sid = sid
        self.publicKey = None
        self.mac = None
        self.authenticated = False
        self.username = None


class SessionManager:
    """Manages the sessions with the clients"""
    def __init__(self):
        self.sessions = {}

    def add_session(self, sid):
        self.sessions[sid] = Session(sid)

    def remove_session(self, sid):
        del self.sessions[sid]

    def get_session(self, sid):
        return self.sessions[sid]

    def set_public_key(self, sid, publicKey):
        self.sessions[sid].publicKey = publicKey

    def get_public_key(self, sid):
        return self.sessions[sid].publicKey

    def set_mac(self, sid, mac):
        self.sessions[sid].mac = mac
    
    def get_mac(self, sid):
        return self.sessions[sid].mac

    def get_sessions(self):
        return self.sessions

    def is_auth(self, sid):
        return self.sessions[sid].authenticated

    def authenticate(self, sid, username):
        self.sessions[sid].authenticated = True
        self.sessions[sid].username = username
    
    def deauthenticate(self, sid):
        self.sessions[sid].authenticated = False
        self.sessions[sid].username = None
    
    def get_username(self, sid):
        return self.sessions[sid].username
    
    def is_online(self, username):
        users = filter(
            lambda session: session.authenticated,
            self.sessions.values()
        )

        return any(map(
            lambda session: session.username == username,
            users
        ))
    
    def get_online_users(self):
        """Get user list to send to client
        Structure:
        {
            "username": "username",
            "id": "id",
        }
        Authenticated users only.
        """

        authenticatedUsers = filter(
            lambda session: session.authenticated,
            self.sessions.values()
        )

        return list(map(
            lambda session: {
                "username": session.username,
                "id": session.sid
            },
            authenticatedUsers
        ))
    
    def get_by_username(self, username):
        """Get session by username"""
        return next(filter(
            lambda session: session.username == username,
            self.sessions.values()
        ), None)