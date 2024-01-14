package Logging

import (
	"log"
	"os"
	"time"
)

type Log_Config struct {
	Path      string
	TimeStamp bool //adds a timestamp to the logs
}

func (l_c Log_Config) Log(message string) {
	file, err := os.OpenFile(l_c.Path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal("Error opening log file: ", err)
	}
	defer file.Close()

	logger := log.New(file, "", 0)

	if l_c.TimeStamp {
		message = time.Now().Format("2006-01-02 15:04:05") + " " + message
	}

	logger.Println(message)
}
