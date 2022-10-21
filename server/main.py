import socketio
import eventlet
import logging
import base64
import json
from hashlib import sha512

import sessions
import encryption
from mac import MAC, validate_mac
import accounts

# =============== CONSTANTS =============== #
HOST = "localhost"
PORT = 8084
BUF = 1024
# ============= CONSTANTS END ============= #

# ============ LOGGING SETUP ============== #
# Format: [HH:MM:SS] (FILE:FUNCTION:LINE) LEVEL: MESSAGE
# Hide wsgi logs
logging.getLogger("engineio").setLevel(logging.WARNING)

logging.basicConfig(
    format="\033[96m[%(asctime)s] (%(filename)s:%(funcName)s:%(lineno)d) %(levelname)s: %(message)s\033[0m",
    level=logging.DEBUG,
    datefmt="%H:%M:%S"
)
# =========== LOGGING SETUP END =========== #
class Server:
    def __init__(self, HOST, PORT):
        """Initialize the server
        
        Events:
            connect             On connection initiated event
            disconnect          On connection closed event
            sendPublicKey       Public key exchange event
            sendMac             MAC exchange event
            login               Login event
            register            Register event
            onlineUsers         Online users event (client request or server broadcast)
        """
        self.host = HOST
        self.port = PORT

        self.publicKey, self.privateKey = encryption.get_key_pair()
        self.sessions = sessions.SessionManager()

        self.sio = socketio.Server()
        self.app = socketio.WSGIApp(self.sio)

        # Events
        self.sio.on("connect", self.on_connect)
        self.sio.on("disconnect", self.on_disconnect)
        self.sio.on("sendPublicKey", self.on_sendPublicKey)
        self.sio.on("login", self.on_login)
        self.sio.on("register", self.on_register)
        self.sio.on("onlineUsers", self.on_onlineUsers)
    
    @validate_mac
    def on_onlineUsers(self, sid, data):
        """When a client requests online users"""
        # filter out the current user
        self.send(sid, "onlineUsers", {
            "users": list(
                filter(
                    lambda x: x['username'] != self.sessions.getUsername(sid),
                    self.sessions.getOnlineUsers()
                )
            )
        })

    @validate_mac
    def on_login(self, sid, data):
        """Login request event
        Data parsed will be in the format:
        {
            "username": "username",
            "password": "password",
        }

        (MAC validation requires the data to be in this format)
        """
        logging.info(f"{self.get_session_name(sid)} Client sent login request: {data}")

        # Query database for user
        username = data["username"]
        password = sha512(data["password"].encode()).hexdigest()

        account = accounts.get_account(username, password)

        if account is None:
            # Account does not exist
            self.send(sid, "login", {
                "success": False,
                "message": "Invalid credentials"
            })
            logging.info(f"{self.get_session_name(sid)} Account does not exist")
        else:
            # Account exists

            # Check if user is already online
            if self.sessions.isOnline(username):
                self.send(sid, "login", {
                    "success": False,
                    "message": "User already logged in"
                })
                logging.info(f"{self.get_session_name(sid)} User already online")
                return
            
            # Successfully logged in
            self.send(sid, "login", {
                "success": True,
                "message": "Login successful",
                "username": username
            })
            logging.info(f"{self.get_session_name(sid)} Account exists")

            self.sessions.authenticate(sid, username)
    
    @validate_mac
    def on_register(self, sid, data):
        """Register request event
        Data parsed will be in the format:
        {
            "username": "username",
            "password": "password",
        }

        (MAC validation requires the data to be in this format)
        """
        logging.info(f"{self.get_session_name(sid)} Client sent register request: {data}")

        # Query to see if username is taken
        username = data["username"]
        password = sha512(data["password"].encode()).hexdigest()

        if accounts.username_exists(username):
            # Username is taken
            self.send(sid, "register", {
                "success": False,
                "message": "Username is taken"
            })
            logging.info(f"{self.get_session_name(sid)} Username is taken")
        else:
            # Username is not taken
            accounts.create_account(username, password)
            self.send(sid, "register", {
                "success": True,
                "message": "Account created",
                "username": username
            })
            logging.info(f"{self.get_session_name(sid)} Account created")

            self.sessions.authenticate(sid, username)

    def on_connect(self, sid, environ):
        """When a client connects"""
        logging.info(f"{self.get_session_name(sid)} Client connected")
        self.sessions.addSession(sid)

        # Send the public key to the client
        self.sio.emit("sendPublicKey", self.publicKey.export_key().decode(), room=sid)
        logging.info(f"{self.get_session_name(sid)} Sent public key to client")

    def on_disconnect(self, sid):
        """When a client disconnects"""
        logging.info(f"{self.get_session_name(sid)} Client disconnected")
        self.sessions.removeSession(sid)
    
    def on_sendPublicKey(self, sid, data):
        """When a client sends their public key"""
        logging.info(f"{self.get_session_name(sid)} Client sent public key: {data}")
        self.sessions.setPublicKey(sid, encryption.load_public_key(data))

        # Send the mac to the client
        mac = MAC()
        self.sessions.setMac(sid, mac)
        self.send(sid, "sendMac", mac.get_mac())
        logging.info(f"{self.get_session_name(sid)} Sent MAC to client")
    
    def decrypt(self, data: bytes) -> str:
        """Decrypt a message"""
        msg = encryption.decrypt(self.privateKey, base64.b64decode(data))
        return msg
    
    def encrypt(self, publicKey: encryption.RsaKey, message: str) -> bytes:
        """Encrypt a message"""
        if isinstance(message, dict):
            message = json.dumps(message)
        
        return encryption.encrypt(publicKey, message)
    
    def send(self, sid, event, message: str):
        """Send an event to a client"""
        self.sio.emit(event, self.encrypt(self.sessions.getPublicKey(sid), message), room=sid)
    
    def broadcast(self, sid, event, message: str):
        """Broadcast an event to all clients"""
        self.sio.emit(event, self.encrypt(self.sessions.getPublicKey(sid), message))
    
    def send_multiple(self, sids, event, message: str):
        """Send an event to multiple clients"""
        for sid in sids:
            self.send(sid, event, message)
    
    def get_session_name(self, sid):
        """Logging username of session ID"""
        try:
            if self.sessions.isAuthenticated(sid):
                return f"[{sid}:{self.sessions.getUsername(sid)}]"
        except:
            pass
        
        return f"[{sid}]"

    def run(self):
        """Run the server"""
        eventlet.wsgi.server(eventlet.listen((HOST, PORT)), self.app)


if __name__ == "__main__":
    server = Server(HOST, PORT)
    server.run()