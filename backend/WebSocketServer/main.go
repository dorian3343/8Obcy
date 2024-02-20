package main

import (
	"WebSocketServer/Handlers"
	"WebSocketServer/Types"
	"WebSocketServer/Utils"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
	"strconv"
)

var Pool = Types.NewUserPool()

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
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

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Err(err).Msg("Something went wrong during upgrade")
		return
	}
	defer conn.Close()

	user := Types.NewUser(conn)
	Pool.Push(&user)
	log.Info().Msg("New User Joined")
	Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
	for {
		var data Types.WsMessage
		// Read message from the client, if it's broken, send a message that it's broken
		_, p, err := conn.ReadMessage()
		if err != nil {
			Handlers.ReportError(user, "", "Error! Could not read message, closing socket")
			log.Err(err).Msg("Could not read message, removing user.")
			Pool.Remove(user)
			Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
			Pool.RemoveById(user.PartnerId)
			log.Info().Msg("Removing user's partner")
			Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
			return
		}

		err = json.Unmarshal(p, &data)
		if err != nil {
			Handlers.ReportError(user, "", "Error! Could not read message, closing socket")
			Pool.Remove(user)
			log.Error().Msg("Could not read message, removing user.")
			Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
			Pool.RemoveById(user.PartnerId)
			log.Info().Msg("Removing Partner")
			Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
			return
		}
		switch data.MessageType {
		case "UserMessage":
			switch data.RequestType {
			case "FindPartner":
				// Match users into pairs
				log.Debug().Msg("Started Matching")
				poolLength := len(Pool.Pool)
				if poolLength%2 != 0 {
					log.Debug().Msg("Uneven Pool")
				}
				for i := 0; i < poolLength-1; i += 2 {
					if Pool.Pool[i].PartnerId == nil && Pool.Pool[i] != &user {
						user1 := Pool.Pool[i]
						user1.PartnerId = user.Conn.RemoteAddr()
						user.PartnerId = user1.Conn.RemoteAddr()
						key, err := Utils.GenerateKey()
						if err != nil {
							log.Err(err).Msg("Error while generating key:")
							return
						}
						user.Key = key
						user1.Key = key
						Handlers.SendSystemMessage(*user1, "", "Found Partner")
						Handlers.SendSystemMessage(user, "", "Found Partner")
						Handlers.SendSystemMessage(*user1, "SetEncKey", key)
						Handlers.SendSystemMessage(user, "SetEncKey", key)
						log.Info().Msg("Made encryption key pair")
						break
					} else {
						Pool.Remove(user)
						Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Something went wrong")
						Pool.RemoveById(user.PartnerId)
						Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
						log.Info().Msg("Disconnecting pair")
						return
					}
				}

			case "ToPartner":
				Handlers.SendPartnerMessage(user, data.Contents, Pool)
				log.Info().Msg("Sending message to parnter")
			case "Typing":
				Handlers.SendSystemMessageToPartner(user, "PartnerTyping", "", Pool)
				log.Info().Msg("Sending typing to partner")
			default:
				Handlers.ReportError(user, "", "Unknown Request Type")
				log.Info().Msg("Received unknown request type for Message Type:User")
			}
		case "SystemMessage":
			switch data.RequestType {
			case "Close":
				Pool.Remove(user)
				Handlers.ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
				Pool.RemoveById(user.PartnerId)
				Handlers.SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
				log.Info().Msg("Disconnecting pair")
				return
			default:
				Handlers.ReportError(user, "", "Unknown Request Type")
				log.Error().Msg("Recieved unknown request type for Message Type:System")
			}
		default:
			Handlers.ReportError(user, "", "Unknown Message Type")
			log.Error().Msg("Received unknown Message Type")
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/count", Handlers.HandleUserCount(&Pool))

	port := 4200
	log.Info().Msg("Server Boot . . .")
	log.Info().Msgf("WebSocket server is listening on :%d...\n", port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		log.Fatal().Err(err)
	}
}
