import pymongo

CLIENT = pymongo.MongoClient("mongodb://localhost:27017/")

def account_exists(username, password):
    """Returns an account if it exists, otherwise returns None"""
    return CLIENT["users"]["credentials"].find_one({"username": username, "password": password})

def create_account(username, password):
    """Creates an account"""
    CLIENT["accounts"]["credentials"].insert_one({"username": username, "password": password})