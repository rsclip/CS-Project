import socketio
import eventlet
import logging
import base64

import sessions
import encryption
from mac import MAC

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
            uploadMessage       Upload message event
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
        self.sio.on("uploadMessage", self.on_uploadMessage)

    def on_uploadMessage(self, sid, data):
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
        logging.info(f"[{sid}] Client sent public key: {data}")
        self.sessions.setPublicKey(sid, encryption.load_public_key(data))

        # Send the mac to the client
        mac = MAC()
        self.sessions.setMac(sid, mac)
        self.__send(sid, "sendMac", mac.get_mac())
        logging.info(f"[{sid}] Sent MAC to client")
    
    def __decrypt(self, data: bytes) -> str:
        """Decrypt a message"""
        msg = encryption.decrypt(self.privateKey, base64.b64decode(data))
        return msg
    
    def __encrypt(self, publicKey: encryption.RsaKey, message: str) -> bytes:
        """Encrypt a message"""
        return encryption.encrypt(publicKey, message)
    
    def __send(self, sid, event, message: str):
        """Send an event to a client"""
        self.sio.emit(event, self.__encrypt(self.sessions.getPublicKey(sid), message), room=sid)
    
    def __broadcast(self, sid, event, message: str):
        """Broadcast an event to all clients"""
        self.sio.emit(event, self.__encrypt(self.sessions.getPublicKey(sid), message))
    
    def _send_multiple(self, sids, event, message: str):
        """Send an event to multiple clients"""
        for sid in sids:
            self.__send(sid, event, message)

    def run(self):
        """Run the server"""
        eventlet.wsgi.server(eventlet.listen((HOST, PORT)), self.app)


if __name__ == "__main__":
    server = Server(HOST, PORT)
    server.run()