package Handlers

import (
	"E2EServer/Types"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// Testing the endpoint to see if it returns the expected key
func TestAssignKey(t *testing.T) {
	//Will always get a 16 digit Key
	requestBody := Types.E2EKeyMessage{Key: "fdc4179bfa62a67e"}
	requestBodyJSON, err := json.Marshal(requestBody)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest("POST", "/assign-key", strings.NewReader(string(requestBodyJSON)))
	if err != nil {
		t.Fatal(err)
	}
	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()

	// Call the AssignKey function with the sample request
	AssignKey(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	responseBody, err := ioutil.ReadAll(rr.Body)
	if err != nil {
		t.Fatal(err)
	}

	var response Types.AESKeyMessage
	err = json.Unmarshal(responseBody, &response)
	if err != nil {
		t.Fatal(err)
	}

	//Assertion
	expectedKey := "YBDVhzYcfGAiOzjLWlA+J18k4b6CSFQT"
	if response.Key != expectedKey {
		t.Errorf("Handler returned unexpected key: got %v want %v", response.Key, expectedKey)
	}
}
