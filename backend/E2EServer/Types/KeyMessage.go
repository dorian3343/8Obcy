package Types

type E2EKeyMessage struct {
	Key string
}

type AESKeyMessage struct {
	Key string `json:"aes_key"`
}
