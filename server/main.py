import socketio
import eventlet
import logging

import sessions
import encryption

# =============== CONSTANTS =============== #
HOST = "localhost"
PORT = 8084
BUF = 1024
# ============= CONSTANTS END ============= #

# ============ LOGGING SETUP ============== #
logging.basicConfig(
    level=logging.DEBUG,
    # Format: [HH:MM:SS] (FILE:FUNCTION:LINE) LEVEL: MESSAGE
    format="[%(asctime)s] (%(filename)s:%(funcName)s:%(lineno)d) %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler()
    ]
)
# =========== LOGGING SETUP END =========== 
class Server:
    def __init__(self, HOST, PORT):
        """Initialize the server
        
        Events:
            connect             When a client connects
            disconnect          When a client disconnects
            sendPublicKey       When a client sends their public key
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

    def on_connect(self, sid, environ):
        """When a client connects"""
        logging.info(f"Client {sid} connected")
        self.sessions.addSession(sid)

    def on_disconnect(self, sid):
        """When a client disconnects"""
        logging.info(f"Client {sid} disconnected")
        self.sessions.removeSession(sid)
    
    def on_sendPublicKey(self, sid, data):
        """When a client sends their public key"""
        logging.info(f"Client {sid} sent data: {data}")
        self.sessions.setPublicKey(sid, data["publicKey"])

    def run(self):
        """Run the server"""
        eventlet.wsgi.server(eventlet.listen((HOST, PORT)), self.app)


if __name__ == "__main__":
    server = Server(HOST, PORT)
    server.run()