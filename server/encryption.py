import os
from Crypto import Random
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey.RSA import RsaKey

from typing import Tuple # for type hinting


KEY_DIR = "keys/"


def get_key_pair() -> Tuple[RsaKey, RsaKey]:
    """Get the cached key pair if it exists"""
    if os.path.exists(KEY_DIR):
        try:
            with open(KEY_DIR + "private.pem", "rb") as f:
                private = RSA.import_key(f.read())
            with open(KEY_DIR + "public.pem", "rb") as f:
                public = RSA.import_key(f.read())
            
            return public, private
        except FileNotFoundError:
            pass

    public, private = generate_key_pair()
    with open(KEY_DIR + "private.pem", "wb") as f:
        f.write(private.export_key())
    with open(KEY_DIR + "public.pem", "wb") as f:
        f.write(public.export_key())
    
    return public, private


def generate_key_pair() -> Tuple[RsaKey, RsaKey]:
    """Generate a key pair 4096 bits"""
    random_generator = Random.new().read
    key = RSA.generate(4096, random_generator)
    public, private = key.publickey(), key
    return public, private


def encrypt(publicKey: RsaKey, message: str) -> bytes:
    """Encrypt a message"""
    cipher = PKCS1_OAEP.new(publicKey)
    return cipher.encrypt(message.encode())

def decrypt(privateKey: RsaKey, message: bytes) -> str:
    """Decrypt a message"""
    cipher = PKCS1_OAEP.new(privateKey)
    return cipher.decrypt(message).decode()


def load_public_key(data: str) -> RsaKey:
    """Load a public key from a string"""
    return RSA.import_key(data.encode())


# Create key directory if not exists
if not os.path.exists(KEY_DIR):
    os.mkdir(KEY_DIR)