package Handlers

import (
	"backend/Types"
	"encoding/json"
	"net/http"
)

func HandleUserCount(p *Types.UserPool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		res, _ := json.Marshal(Types.NewCountMessage(len(p.Pool)))
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Write(res)
	}
}
