
function decrypt(ciphertext, key) {
    let decryptedText = '';
    for (let i = 0; i < ciphertext.length; i++) {
        let charCode = ciphertext.charCodeAt(i);
        if (ciphertext[i].match(/[a-zA-Z]/)) {
            let isUpperCase = ciphertext[i] === ciphertext[i].toUpperCase();
            charCode = ((charCode - (isUpperCase ? 65 : 97) - key + 26) % 26) + (isUpperCase ? 65 : 97)-3;
        }
        decryptedText += String.fromCharCode(charCode);
    }
    return decryptedText;
}

export default decrypt