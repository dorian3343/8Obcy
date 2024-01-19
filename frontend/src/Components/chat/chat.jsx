import './chat.css';

function Chat({ chatStatus, messages, showTyping }) {
    return (
        <div className="content-wrapper">
            <div className="messages-wrapper">
                <p>{chatStatus}</p>
                {messages.map((message, index) => (
                    <div key={index} className="content-item">
                        {message}
                    </div>
                ))}
            </div>
            {showTyping ? <p className="typing-indicator">Obcy pisze...</p> : null}
        </div>
    );
}

export default Chat;
