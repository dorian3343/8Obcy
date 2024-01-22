package Handlers

import (
	"E2EServer/Types"
	"E2EServer/Utils"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

func AssignKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		// If not, respond with a 405 Method Not Allowed status
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	// Read the body from the request
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	var requestBody Types.E2EKeyMessage
	err = json.Unmarshal(body, &requestBody)
	if err != nil {
		http.Error(w, "Error unmarshaling JSON", http.StatusBadRequest)
		return
	}
	aesKey, err := Utils.GenerateAESKey(requestBody.Key)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error finding or creating AES key", http.StatusInternalServerError)
		return
	}
	response := Types.AESKeyMessage{Key: aesKey}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		fmt.Println("Error encoding response:", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}
