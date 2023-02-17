def handle_errors(func):
    """Decorate to handle and return errors properly"""
    def wrapper(self, sid, data):
        try:
            return func(self, sid, data)
        except Exception as e:
            print(f"[{sid}] Error: {e}")
            self.send(sid, "error", {
                "type": "InternalError",
                "message": str(e)
            })
            raise e
        
    return wrapper