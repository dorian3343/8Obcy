//Standard for sending messages on Ws

class WsMessage {
    constructor(messageType,requestType,contents) {
        this.MessageType = messageType; //SystemMessage / PearMessage / UserMessage / Error
        this.RequestType = requestType //SendMessage / FindPartner / optional
        this.Contents = contents;
    }
}
export default WsMessage