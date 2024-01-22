package Utils

import (
	"testing"
)

func TestGenerateKey(t *testing.T) {
	x, err := GenerateKey()
	if err != nil {
		t.Fatal(err)
	}
	if len(x) != 16 {
		t.Fatal("Incorrect Key length")
	}
}
