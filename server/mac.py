import uuid
import logging
import json

def validate_mac(func):
        """Decorator to validate MAC in an event
        
        In every MAC-protected event, the data provided in the `data`
        parameter must be a dictionary with the following structure:
        {
            "mac": "MAC",
            "data": "DATA"
        }
        """
        def wrapper(self, sid, data):
            # Decrypt data
            data = json.loads(self.decrypt(data))

            print(data)

            # Validate MAC based on SID
            try:
                expectedMac = self.sessions.getMac(sid)
                providedMac = data["MAC"]

                if expectedMac.validate_mac(providedMac):
                    return func(self, sid, data["data"])
                else:
                    errorType = "MACInvalid"
                    errorMsg = f"Invalid MAC (expected '{expectedMac}', got '{providedMac}')"
            except KeyError:
                errorType = "MACMissing"
                errorMsg = "MAC not provided"

            # MAC is invalid
            logging.error(f"[{sid}] MAC validation failed: {errorMsg}")
            self.send(sid, "error", {
                "type": errorType,
                "message": errorMsg
            })

        return wrapper

class MAC:
    """Message Authentication Code"""
    def __init__(self):
        self.mac = self.__gen_mac()
    
    def get_mac(self):
        return self.mac
    
    def validate_mac(self, mac):
        return mac == self.mac

    def __gen_mac(self):
        return uuid.uuid4().hex