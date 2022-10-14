import uuid

def dec(func):
    def wrapper(self, *args, **kwargs):
        if args[0] in self.valid:
            return func(self, *args, **kwargs)
        else:
            return 0

    return wrapper

class MAC:
    """Message Authentication Code"""
    def __init__(self):
        self.mac = self.__gen_mac()
    
    def get_mac(self):
        return self.mac
    
    def check(self, mac):
        return mac == self.mac

    def __gen_mac(self):
        return uuid.uuid4().hex