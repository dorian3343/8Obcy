package Utils

import (
	"crypto/rand"
	"encoding/hex"
)

// Generates a key with a length of 16
func GenerateKey() (string, error) {
	numBytes := 8

	randomBytes := make([]byte, numBytes)

	_, err := rand.Read(randomBytes)
	if err != nil {
		return "", err
	}

	randomString := hex.EncodeToString(randomBytes)

	return randomString, nil
}
