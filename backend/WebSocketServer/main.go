package main

import (
	"WebSocketServer/Handlers"
	"WebSocketServer/Types"
	"WebSocketServer/Utils"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"net/http"
	"strconv"
)

var Pool = Types.NewUserPool()
var LogConf = Utils.LogConfig{Path: "main.log", TimeStamp: true}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		LogConf.Log("Something went wrong during upgrade:" + err.Error())
		return
	}
	defer conn.Close()

	user := Types.NewUser(conn)
	Pool.Push(&user)
	LogConf.Log("New user joined")
	Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
	for {
		var data Types.WsMessage
		// Read message from the client, if its broken, send a message that its broken
		_, p, err := conn.ReadMessage()
		if err != nil {
			Handlers.HandleErrorMessage(user, Pool, LogConf)
			return
		}

		err = json.Unmarshal(p, &data)
		if err != nil {
			Handlers.HandleErrorMessage(user, Pool, LogConf)
			return
		}

		if data.MessageType == "UserMessage" {
			if data.RequestType == "FindPartner" {
				if user.PartnerId == nil {
					//Match users into pair's
					LogConf.Log("Starting Matching")
					poolLength := len(Pool.Pool)
					if poolLength%2 != 0 {
						LogConf.Log("Uneven pool")
					}
					for i := 0; i < poolLength-1; i += 2 {
						if Pool.Pool[i].PartnerId == nil && Pool.Pool[i] != &user {
							user1 := Pool.Pool[i]
							user1.PartnerId = user.Conn.RemoteAddr()
							user.PartnerId = user1.Conn.RemoteAddr()
							key, err := Utils.GenerateKey()
							if err != nil {
								LogConf.Log("Errr while generating key:" + err.Error())

								return
							}
							user.Key = key
							user1.Key = key
							Handlers.SendSystemMessage(*user1, "", "Found Partner")
							Handlers.SendSystemMessage(user, "", "Found Partner")
							Handlers.SendSystemMessage(*user1, "SetEncKey", key)
							Handlers.SendSystemMessage(user, "SetEncKey", key)
							LogConf.Log("Pair made + Key's assigned")
							break
						}
					}
				}
			} else if data.RequestType == "ToPartner" {
				Handlers.SendPartnerMessage(user, data.Contents, Pool)
				LogConf.Log("Sending  message to partner")
			} else if data.RequestType == "Typing" {
				Handlers.SendSystemMessageToPartner(user, "PartnerTyping", "", Pool)
				LogConf.Log("Sending Typing  to partner")
			} else {
				Handlers.ReportError(user, "", "Unknown Request Type")
				LogConf.Log("Recieved unknown request type for Message Type:User")
			}
		} else if data.MessageType == "SystemMessage" {
			Handlers.HandleSystemMessage(data, user, Pool, LogConf)
		} else {
			Handlers.ReportError(user, "", "Unknown Message Type")
			LogConf.Log("Recieved unknown Message Type")
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/count", Handlers.HandleUserCount(&Pool))

	port := 4200
	LogConf.Log("Server Boot . . .")
	fmt.Printf("WebSocket server is listening on :%d...\n", port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		fmt.Println(err)
	}
}
