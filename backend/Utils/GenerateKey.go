package Utils

import (
	"encoding/binary"
	"math/rand"
)

func GenerateKey() (int, error) {
	byteLen := 4

	bytes := make([]byte, byteLen)
	_, err := rand.Read(bytes)
	if err != nil {
		return 0, err
	}

	randomInt := int(binary.BigEndian.Uint32(bytes))

	return randomInt, nil
}
