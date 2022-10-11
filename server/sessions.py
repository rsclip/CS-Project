class Session:
    """Represents a session with a client"""
    def __init__(self, sid):
        self.sid = sid
        self.publicKey = None


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

    def getSessions(self):
        return self.sessions