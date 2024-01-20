package Handlers

import (
	"backend/Types"
	"encoding/json"
	"net/http"
)

func HandleUserCount(p *Types.UserPool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check if the request method is GET
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Marshal user count and handle errors
		res, err := json.Marshal(Types.NewCountMessage(len(p.Pool)))
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		// Set headers and write the response
		SetJSONHeaders(w)
		w.Write(res)
	}
}

func SetJSONHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
}
