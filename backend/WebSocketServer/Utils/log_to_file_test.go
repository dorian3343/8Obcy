package Utils

import (
	"io/ioutil"
	"os"
	"testing"
	"time"
)

func TestLog(t *testing.T) {
	// Create a temporary log file
	tmpfile, err := ioutil.TempFile("", "testing")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(tmpfile.Name())

	logConfig := LogConfig{Path: tmpfile.Name(), TimeStamp: true}

	logConfig.Log("Test log message")

	content, err := ioutil.ReadFile(tmpfile.Name())
	if err != nil {
		t.Fatal(err)
	}

	// Verify that the log message is present in the file
	expectedMessage := time.Now().Format("2006-01-02 15:04:05") + " Test log message\n"
	if string(content) != expectedMessage {
		t.Errorf("Expected log content:\n%s\nGot:\n%s", expectedMessage, content)
	}
}
