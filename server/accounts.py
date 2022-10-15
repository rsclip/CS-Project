import pymongo

CLIENT = pymongo.MongoClient("mongodb://localhost:27017/")

def get_account(username, password):
    """Returns an account if it exists, otherwise returns None"""
    return CLIENT["users"]["credentials"].find_one({"username": username, "password": password})

def username_exists(username):
    """Returns True if the username exists, otherwise returns False"""
    return CLIENT["users"]["credentials"].find_one({"username": username}) is not None

def create_account(username, password):
    """Creates an account"""
    CLIENT["users"]["credentials"].insert_one({"username": username, "password": password})