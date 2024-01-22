package Handlers

import (
	"WebSocketServer/Types"
	"errors"
	"fmt"
	"net"
)

func ReportError(user Types.User, requestType string, message string) {
	user.Conn.WriteJSON(Types.NewWsMessage("Error", requestType, message))
	user.Conn.Close()

}

func ReportErrorById(id net.Addr, requestType string, Pool Types.UserPool, message string) {
	var user Types.User
	for i := 0; i < len(Pool.Pool); i++ {
		if Pool.Pool[i].Id == id {
			user = *Pool.Pool[i]
		}
	}
	user.Conn.WriteJSON(Types.NewWsMessage("Error", requestType, message))
	user.Conn.Close()
}

func SendSystemMessage(user Types.User, requestType, message string) {
	user.Conn.WriteJSON(Types.NewWsMessage("SystemMessage", requestType, message))
}

func SendSystemMessageToPartner(user Types.User, requestType, message string, Pool Types.UserPool) {
	var partner Types.User
	for i := 0; i < len(Pool.Pool); i++ {
		if Pool.Pool[i].Id == user.PartnerId {
			partner = *Pool.Pool[i]
			break
		}
	}

	if partner.Conn == nil {
		fmt.Println("Partner not connected.")
		return
	}

	partner.Conn.WriteJSON(Types.NewWsMessage("SystemMessage", requestType, message))
}
func SendPartnerMessage(user Types.User, message string, Pool Types.UserPool) error {
	var partner Types.User

	for i := 0; i < len(Pool.Pool); i++ {
		fmt.Println(Pool.Pool[i])
		if Pool.Pool[i].Id == user.PartnerId {
			partner = *Pool.Pool[i]
			break
		}
	}

	if partner.Conn == nil {
		return errors.New("partner connection is nil")
	}

	if err := partner.Conn.WriteJSON(Types.NewWsMessage("PartnerMessage", "", message)); err != nil {
		return fmt.Errorf("error sending message to partner: %v", err)
	}

	return nil
}

func SendAll(requestType string, message string, pool Types.UserPool) {
	for i := 0; i < len(pool.Pool); i++ {
		pool.Pool[i].Conn.WriteJSON(Types.NewWsMessage("SystemMessage", requestType, message))
	}
}
