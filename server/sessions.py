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

    def addSession(self, sid):
        self.sessions[sid] = Session(sid)

    def removeSession(self, sid):
        del self.sessions[sid]

    def getSession(self, sid):
        return self.sessions[sid]

    def setPublicKey(self, sid, publicKey):
        self.sessions[sid].publicKey = publicKey

    def getPublicKey(self, sid):
        return self.sessions[sid].publicKey

    def setMac(self, sid, mac):
        self.sessions[sid].mac = mac
    
    def getMac(self, sid):
        return self.sessions[sid].mac

    def getSessions(self):
        return self.sessions

    def isAuthenticated(self, sid):
        return self.sessions[sid].authenticated

    def authenticate(self, sid, username):
        self.sessions[sid].authenticated = True
        self.sessions[sid].username = username
    
    def deauthenticate(self, sid):
        self.sessions[sid].authenticated = False
        self.sessions[sid].username = None
    
    def getUsername(self, sid):
        return self.sessions[sid].username
    
    def getOnlineUsers(self):
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