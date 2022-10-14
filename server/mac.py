import uuid

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