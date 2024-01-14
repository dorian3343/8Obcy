package Utils

func Encrypt(plaintext string, key int) string {
	ciphertext := ""
	for _, char := range plaintext {
		if (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') {
			var base int
			if char >= 'A' && char <= 'Z' {
				base = int('A')
			} else {
				base = int('a')
			}
			ciphertext += string((int(char)+key-base)%26 + base)
		} else {
			ciphertext += string(char)
		}
	}
	return ciphertext
}
