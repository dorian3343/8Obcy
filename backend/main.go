package main

import (
	"backend/Handlers"
	"backend/Types"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"net/http"
	"strconv"
)

var Pool = Types.NewUserPool()

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
	Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
	for {
		var data Types.WsMessage
		// Read message from the client
		_, p, err := conn.ReadMessage()
		if err != nil {
			Handlers.ReportError(user, "", "Error! Could not read message, closing socket")
			Pool.Remove(user)
			Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
			Pool.RemoveById(user.PartnerId)
			Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)

			return
		}
		err = json.Unmarshal(p, &data)
		if err != nil {
			Handlers.ReportError(user, "", "Error! Could not read message, closing socket")
			Pool.Remove(user)
			Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
			Pool.RemoveById(user.PartnerId)
			Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
			return
		}
		if data.MessageType == "UserMessage" {
			if data.RequestType == "FindPartner" {
				if user.PartnerId == nil {
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
							fmt.Println(user1, user)
							Handlers.SendSystemMessage(*user1, "Found Partner")
							Handlers.SendSystemMessage(user, "Found Partner")
							break
						}
					}
				}
			} else if data.RequestType == "ToPartner" {
				Handlers.SendPartnerMessage(user, data.Contents, Pool)
			}
		} else if data.MessageType == "SystemMessage" {
			if data.RequestType == "Close" {
				Pool.Remove(user)
				Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
				Pool.RemoveById(user.PartnerId)
				Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
				return
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/count", Handlers.HandleUserCount(&Pool))

	port := 8080
	fmt.Printf("WebSocket server is listening on :%d...\n", port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		fmt.Println(err)
	}
}
