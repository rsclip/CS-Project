'use strict';

const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

let keyCacheDir = "./keys/";

/**
 * Get the passphrase for the private key
 * Includes the username
 * 
 * @returns {string}
*/
function get_passphrase() {
    return "cs-messaging-app" + os.userInfo().username;
}

// check if the key cache directory exists
if (!fs.existsSync(keyCacheDir)) {
    fs.mkdirSync(keyCacheDir);
};

// check if public and private keys are cached
function isKeyCached() {
    return (fs.existsSync(keyCacheDir + "public.pem") && fs.existsSync(keyCacheDir + "private.pem"));
}

function genKeyPair() {
    const publicPath = keyCacheDir + "public.pem";
    const privatePath = keyCacheDir + "private.pem";

    console.log("Generating new key pair");
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        // match the public key algorithm (RSA PKCS1_OAEP 4096)
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: get_passphrase()
        }
    });

    console.log("Generated public/private key pair");

    // delete if pre-existing
    if (fs.existsSync(publicPath)) {
        fs.unlinkSync(publicPath);
    }
    if (fs.existsSync(privatePath)) {
        fs.unlinkSync(privatePath);
    }

    // write the keys to the cache
    fs.writeFileSync(publicPath, publicKey);
    fs.writeFileSync(privatePath, privateKey);

    return {
        publicKey,
        privateKey
    };
}

// Decrypt a chunk using a private key
function encryptRaw(publicKey, message) {
    const buffer = Buffer.from(message);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    console.log("Encrypted chunk ", message, " to ", encrypted, " (", encrypted.toString("base64"), ")");
    return encrypted.toString("base64");
}

// Decrypt a chunk using a private key
function decryptRaw(privateKey, message) {
    const buffer = Buffer.from(message, "base64");
    const decrypted = crypto.privateDecrypt({
        key: privateKey,
        passphrase: get_passphrase()
    }, buffer);
    return decrypted.toString("utf8");
}

// ==================== EXPORT FUNCTIONS ==================== //

// Get the public and private key pairs by
// checking in cache first, then generating
// new ones if they don't exist
function getKeyPairs() {
    if (!isKeyCached()) {
        console.log("Key pair not cached");
        return genKeyPair();
    } else {
        console.log("Key pair cached");
        return {
            publicKey: fs.readFileSync(keyCacheDir + "public.pem", "utf8"),
            privateKey: fs.readFileSync(keyCacheDir + "private.pem", "utf8")
        };
    }
}

// Encrypt a message using a public key
function encrypt(publicKey, message) {
    // split message into chunk of 400 bytes
    const chunkSize = 400;
    const chunks = [];

    for (let i = 0; i < message.length; i += chunkSize) {
        chunks.push(message.substr(i, chunkSize));
    }

    console.log("Encrypting " + chunks.length + " chunks:", chunks);

    // encrypt each chunk and encode base64
    const encryptedChunks = chunks.map(chunk => {
        return encryptRaw(publicKey, chunk);
    });

    console.log("Encrypted chunks:", encryptedChunks);

    // convert to string
    return JSON.stringify(encryptedChunks);
}

// Encrypt an object using a public key
function encryptObject(publicKey, object) {
    return encrypt(publicKey, JSON.stringify(object));
}

// Decrypt a message using a private key
function decrypt(privateKey, message) {
    try {
        // split message into chunks
        const chunks = JSON.parse(message);

        console.log("Decrypting " + chunks.length + " chunks:", chunks);

        // decrypt each chunk
        const decryptedChunks = chunks.map(chunk => {
            return decryptRaw(privateKey, chunk);
        });

        // convert to string
        return decryptedChunks.join("");
    } catch (e) {
        console.log("Error decrypting:", e);
        return null;
    }
}

// Decrypt an object using a private key
function decryptObject(privateKey, object) {
    return JSON.parse(decrypt(privateKey, object));
}

// Parse a public key from a string
function parsePublicKey(publicKey) {
    return crypto.createPublicKey(publicKey);
}

// Load a public key from a file
function loadCachedPublicKey(name) {
    return parsePublicKey(fs.readFileSync(keyCacheDir + name + ".pem", "utf8"));
}

// ========================================================= //


// ======================== EXPORTS ======================== //
exports.getKeyPairs = getKeyPairs;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.parsePublicKey = parsePublicKey;
exports.encryptObject = encryptObject;
exports.decryptObject = decryptObject;
exports.loadCachedPublicKey = loadCachedPublicKey;