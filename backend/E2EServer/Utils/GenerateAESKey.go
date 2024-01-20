package Utils

import (
	"crypto/sha256"
	"encoding/base64"
)

func GenerateAESKey(input string) (string, error) {
	// Use SHA-256 hash to produce a consistent output for the given input
	hash := sha256.New()
	hash.Write([]byte(input))
	hashedInput := hash.Sum(nil)

	// Ensure the hashed string is exactly 32 bytes by trimming any extra padding
	hashedString := base64.StdEncoding.EncodeToString(hashedInput)[:32]

	return hashedString, nil
}
