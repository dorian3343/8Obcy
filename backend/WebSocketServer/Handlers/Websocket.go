package Handlers

import (
	"WebSocketServer/Types"
	"WebSocketServer/Utils"
	"strconv"
)

// System Messages
func HandleSystemMessage(data Types.WsMessage, user Types.User, Pool Types.UserPool, LogConf Utils.LogConfig) {
	switch data.RequestType {
	case "Close":
		HandleSystemMessageClose(user, Pool, LogConf)
	default:
		ReportError(user, "", "Unknown Request Type")
		LogConf.Log("Received unknown request type for Message Type:System")
	}
}
func HandleSystemMessageClose(user Types.User, Pool Types.UserPool, LogConf Utils.LogConfig) {
	Pool.Remove(user)
	ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
	Pool.RemoveById(user.PartnerId)
	SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
	LogConf.Log("Disconnecting pair")
	return
}

// Websocket errors with messages
func HandleErrorMessage(user Types.User, Pool Types.UserPool, LogConf Utils.LogConfig) {
	ReportError(user, "", "Error! Could not read message, closing socket")
	LogConf.Log("Could not read message, removing user.")
	Pool.Remove(user)
	ReportErrorById(user.PartnerId, "Disconnect", Pool, "Error! Partner Disconnected")
	Pool.RemoveById(user.PartnerId)
	LogConf.Log("Removing user's partner")
	SendAll("UpdateCount", strconv.Itoa(len(Pool.Pool)), Pool)
}
