package main

import (
	"E2EServer/Handlers"
	"fmt"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
)

func main() {
	port := 3069

	file, err := os.OpenFile("./log.json", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
	if err != nil {
		log.Fatal().Err(err).Msg("Error opening log file")
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			log.Fatal().Err(err).Msg("Error while closing log file")
		}
	}(file)

	multi := zerolog.MultiLevelWriter(zerolog.ConsoleWriter{Out: os.Stdout}, file)
	log.Logger = zerolog.New(multi).With().Timestamp().Logger()
	http.HandleFunc("/assign", Handlers.AssignKey)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Handle other routes if needed
		http.NotFound(w, r)
	})

	// Enable CORS for all routes
	corsHandler := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			h.ServeHTTP(w, r)
		})
	}

	fmt.Printf("E2E key server is listening on :%d...\n", port)
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), corsHandler(http.DefaultServeMux))
	if err != nil {
		log.Fatal().Err(err)
	}
}
