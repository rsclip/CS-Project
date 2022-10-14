import socketio
import eventlet
import logging
import base64

import sessions
import encryption

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
            connect             When a client connects
            disconnect          When a client disconnects
            sendPublicKey       When a client sends their public key
            message             When a client sends a message
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
        self.sio.on("message", self.on_message)

        # Messages queue

    def on_message(self, sid, data):
        """When a client sends a message"""
        logging.info(f"[{sid}] Client sent data: {data}")
        # Decrypt the message
        message = self.__decrypt(data)
        logging.info(f"[{sid}] Decrypted message: {message}")

    def on_connect(self, sid, environ):
        """When a client connects"""
        logging.info(f"[{sid}] Client connected")
        self.sessions.addSession(sid)

        # Send the public key to the client
        self.sio.emit("sendPublicKey", self.publicKey.export_key().decode(), room=sid)
        logging.info(f"[{sid}] Sent public key to client")

    def on_disconnect(self, sid):
        """When a client disconnects"""
        logging.info(f"[{sid}] Client disconnected")
        self.sessions.removeSession(sid)
    
    def on_sendPublicKey(self, sid, data):
        """When a client sends their public key"""
        logging.info(f"[{sid}] Client sent data: {data}")
        self.sessions.setPublicKey(sid, data)
    
    def __decrypt(self, data: bytes) -> str:
        """Decrypt a message"""
        msg = encryption.decrypt(self.privateKey, base64.b64decode(data))
        return msg

    def run(self):
        """Run the server"""
        eventlet.wsgi.server(eventlet.listen((HOST, PORT)), self.app)


if __name__ == "__main__":
    server = Server(HOST, PORT)
    server.run()