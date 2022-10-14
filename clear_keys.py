import os

# Delete the public/private key files for client and server
os.remove("client/keys/public.pem")
os.remove("client/keys/private.pem")
os.remove("server/keys/public.pem")
os.remove("server/keys/private.pem")

print("Deleted keys")