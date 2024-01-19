import './chat.css'
function Chat({chatStatus,messages}){
    return (
        <div className="content-wrapper">
            <p style={{ fontSize: '1.2em', fontWeight: 'bolder' }}>{chatStatus}</p>
            {messages.map((message, index) => (
                <div key={index} className="content-item">
                    {message}
                </div>
            ))}
        </div>
    );
}

export default Chat;