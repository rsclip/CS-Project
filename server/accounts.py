import pymongo
import logging

CLIENT = pymongo.MongoClient("mongodb://localhost:27017/")

def requires_authentication(func):
    """Decorator to validate authentication in an event
    """
    def wrapper(self, sid, data):
        # Validate authentication based on SID
        if self.sessions.isAuthenticated(sid):
            return func(self, sid, data)
        else:
            errorType = "AuthenticationInvalid"
            errorMsg = "Invalid authentication"

        # Authentication is invalid
        logging.error(f"[{sid}] Authentication validation failed: {errorMsg}")
        self.send(sid, "error", {
            "type": errorType,
            "message": errorMsg
        })

    return wrapper

def get_account(username, password):
    """Returns an account if it exists, otherwise returns None"""
    return CLIENT["users"]["credentials"].find_one({"username": username, "password": password})

def username_exists(username):
    """Returns True if the username exists, otherwise returns False"""
    return CLIENT["users"]["credentials"].find_one({"username": username}) is not None

def create_account(username, password):
    """Creates an account"""
    CLIENT["users"]["credentials"].insert_one({"username": username, "password": password})