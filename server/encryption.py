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

    private, public = generate_key_pair()
    with open(KEY_DIR + "private.pem", "wb") as f:
        f.write(private.export_key())
    with open(KEY_DIR + "public.pem", "wb") as f:
        f.write(public.export_key())
    
    return private, public


def generate_key_pair() -> Tuple[RsaKey, RsaKey]:
    """Generate a key pair"""
    random_generator = Random.new().read
    key = RSA.generate(1024, random_generator)
    private, public = key, key.publickey()
    return private, public


def encrypt(public_key: RsaKey, message: str) -> bytes:
    """Encrypt a message with a public key"""
    cipher = PKCS1_OAEP.new(public_key)
    return cipher.encrypt(message.encode("utf-8"))


def decrypt(private_key: RsaKey, encrypted_message: bytes) -> str:
    """Decrypt a message with a private key"""
    cipher = PKCS1_OAEP.new(private_key)
    return cipher.decrypt(encrypted_message).decode("utf-8")


# Create key directory if not exists
if not os.path.exists(KEY_DIR):
    os.mkdir(KEY_DIR)