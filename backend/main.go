package main

import (
	"backend/Handlers"
	"backend/Logging"
	"backend/Types"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"net/http"
	"strconv"
)

var Pool = Types.NewUserPool()
var LogConf = Logging.Log_Config{Path: "main.log", TimeStamp: true}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer conn.Close()

	user := Types.NewUser(conn)
	Pool.Push(&user)
	LogConf.Log("New user joined")
	Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
	for {
		var data Types.WsMessage
		// Read message from the client
		_, p, err := conn.ReadMessage()
		if err != nil {
			Handlers.ReportError(user, "", "Error! Could not read message, closing socket")
			LogConf.Log("Could not read message, removing user.")
			Pool.Remove(user)
			Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
			Pool.RemoveById(user.PartnerId)
			LogConf.Log("Removing user's partner")
			Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)

			return
		}
		err = json.Unmarshal(p, &data)
		if err != nil {
			Handlers.ReportError(user, "", "Error! Could not read message, closing socket")
			Pool.Remove(user)
			LogConf.Log("Could not read message, removing user.")
			Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
			Pool.RemoveById(user.PartnerId)
			LogConf.Log("Removing user's partner")
			Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
			return
		}
		if data.MessageType == "UserMessage" {
			if data.RequestType == "FindPartner" {
				if user.PartnerId == nil {
					//Match users into pair's
					LogConf.Log("Starting Matching")
					poolLength := len(Pool.Pool)
					if poolLength%2 != 0 {
						lastUser := Pool.Pool[poolLength-1]
						fmt.Printf("Single user: %v\n", lastUser.Conn.RemoteAddr())
					}
					for i := 0; i < poolLength-1; i += 2 {
						if Pool.Pool[i].PartnerId == nil && Pool.Pool[i] != &user {
							user1 := Pool.Pool[i]
							user1.PartnerId = user.Conn.RemoteAddr()
							user.PartnerId = user1.Conn.RemoteAddr()
							Handlers.SendSystemMessage(*user1, "Found Partner")
							Handlers.SendSystemMessage(user, "Found Partner")
							LogConf.Log("Match made")
							break
						}
					}
				}
			} else if data.RequestType == "ToPartner" {
				Handlers.SendPartnerMessage(user, data.Contents, Pool)
				LogConf.Log("Sending message to partner")
			} else {
				Handlers.ReportError(user, "", "Unknown Request Type")
				LogConf.Log("Recieved unknown request type for Message Type:User")

			}
		} else if data.MessageType == "SystemMessage" {
			if data.RequestType == "Close" {
				Pool.Remove(user)
				Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
				Pool.RemoveById(user.PartnerId)
				Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
				return
				LogConf.Log("Disconnecting pair")
			} else {
				Handlers.ReportError(user, "", "Unknown Request Type")
				LogConf.Log("Recieved unknown request type for Message Type:System")
			}
		} else {
			Handlers.ReportError(user, "", "Unknown Message Type")
			LogConf.Log("Recieved unknown Message Type")
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/count", Handlers.HandleUserCount(&Pool))

	port := 8080
	LogConf.Log("Server Boot . . .")
	fmt.Printf("WebSocket server is listening on :%d...\n", port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		fmt.Println(err)
	}
}
