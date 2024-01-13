package Types

// WsMessage represents a message for WebSocket communication.
type WsMessage struct {
	MessageType string // SystemMessage / PearMessage / UserMessage / Error
	RequestType string //SendMessage / FindPartner / Optional / UpdateCount
	Contents    string
}

// NewWsMessage creates a new instance of WsMessage.
func NewWsMessage(messageType string, requestType string, contents string) *WsMessage {
	return &WsMessage{
		MessageType: messageType,
		RequestType: requestType,
		Contents:    contents,
	}
}
