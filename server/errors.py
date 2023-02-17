import traceback

def handle_errors(func):
    """Decorate to handle and return errors properly"""
    def wrapper(self, sid, *args):
        try:
            return func(self, sid, *args)
        except Exception as e:
            print(f"[{sid}] {traceback.format_exc()}")
            self.send(sid, "error", {
                "type": "InternalError",
                "message": str(e)
            })
            raise e
        
    return wrapper