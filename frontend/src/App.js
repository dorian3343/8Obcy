import React, {useEffect, useState} from 'react';
import Header from "./Components/header/header";
import UMessage from "./Components/message/uMessage";
import PMessage from "./Components/message/pMessage";
import './App.css'
import WsMessage from "./ws/template";
let socket;

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}


function App() {
    useEffect(() => {
        fetch('http://localhost:8080/count')
            .then((response) => response.json())
            .then((json) => {setUserCount(json.Count)});
    }, []);


    const [userCount, setUserCount] = useState(0)
    const [messages, setMessages] = useState([])
    const [status,setStatus] = useState("Szukanie rozmówce. . . ")
    const [inChat,setInChat] = useState(false);
    const [message, setMessage] = useState("")
    const [modalStatePartner, setModalStatePartner] = useState(false)
    const [modalStateEmpty, setModalStateEmpty] = useState(false)

    function handleChange(event) {
        setMessage(event.target.value);
    }

    function handleJoin() {
        setInChat(true);
        socket = new WebSocket('ws://localhost:8080/ws');

        socket.addEventListener('open', () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(new WsMessage("UserMessage", "FindPartner", "")));
            }
        });

        socket.addEventListener('message', (event) => {
            let data = JSON.parse(event.data);
            if (data.MessageType === "SystemMessage") {
                if (data.RequestType === "UpdateCount"){
                    setUserCount(data.Contents)
                }
                if (data.Contents === "Found Partner") {
                    setStatus("Rozpoczęto rozmowę z obcym.. przywitaj się, napisz „hej” :)");
                }
            } else if (data.MessageType === "PartnerMessage") {
                setMessages(prevMessages => [...prevMessages, <PMessage key={generateUniqueId()} message={data.Contents}></PMessage>]);
            } else if (data.MessageType === "Error"){
                if (data.Contents=== "Error! Partner Disconnected"){
                    setModalStatePartner(true)
                    setStatus("Zakończono rozmowe z obcym...");
                }
            }
        });
        socket.addEventListener("close", () => {
            socket.send(JSON.stringify(new WsMessage("SystemMessage","Close","")));
        });

    }
    function handleKeyDown(event){
        if (event.key === 'Enter') {
            handleSend();
        }
    };

    function closeEmptyModal(){
        setModalStateEmpty(false)
    }


    function handleSend() {
        console.log(message)
        //regex because it sends message with just enter in it
        const regex = /^[ \n]*$/;
        if (regex.test(message)) {
            setModalStateEmpty(true)
            return
        }

        setMessages(prevMessages => [...prevMessages, <UMessage key={generateUniqueId()} message={message}></UMessage>]);
        setMessage("")
        document.getElementById("main-input").value = ""
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(new WsMessage("UserMessage", "ToPartner", message)));
        } else {
            console.error('WebSocket connection is not open.');
        }
    }

    return (
        <div>
            <Header UserCount={userCount}></Header>
            <br/>
            <div className="app-main-wrapper">
                {inChat ? <div>
                        <div className="content-wrapper">
                            <p style={{fontSize: '1.2em', fontWeight: 'bolder'}}>{status}</p>
                            {messages.map((message, index) => (
                                <div key={index} className="content-item">
                                    {message}
                                </div>
                            ))}
                        </div>
                        <div className="input-wrapper">
                            <div className="button-wrapper" id="buttonLeave">
                                <p>Rozłącz sie</p>
                                <p style={{color: "#9E8F6D"}}>ESC</p>
                            </div>
                            <div className="text-input-wrapper">
                                <textarea  className="text-input" placeholder="Cześć..." id="main-input"  onKeyDown={handleKeyDown} onChange={handleChange}/>
                            </div>
                            <div className="button-wrapper" id="buttonSend" onClick={handleSend}>
                                <p>Wyślij wiadomość</p>
                                <p style={{color: "#9E8F6D"}}>ENTER</p>
                            </div>
                        </div>
                    </div> :
                    <div className="intro-wrapper">
                        <h1>Witaj w 8obcy.pl</h1>
                        <p>8obcy.pl jest platformą do anonimowego spotykania nowych ludzi .Po prostu kliknij "Dołącz do
                            czatu", aby rozpocząć anonimową rozmowę z losową osobą/użytkownikiem.Jeśli rozmowa nie
                            będzie interesująca, możesz przejść do następnej. Powodzenia! :)</p>
                        <h2>Regulamin:</h2>
                        <ul>
                            <li>Zachowuj się z szacunkiem wobec innych użytkowników.</li>
                            <li>Nie używaj obraźliwych słów ani treści.</li>
                            <li>Nie rozpowszechniaj fałszywych informacji.</li>
                            <li>Chron prywatność innych uczestników.</li>
                            <li>Nie zachęcaj do przemocy ani niebezpiecznych działań.</li>
                            <li>Respektuj zasady prawa.</li>
                            <li>Nie spamuj ani nie nadużywaj funkcji platformy.</li>
                            <li>Staraj się utrzymać pozytywną atmosferę rozmów.</li>
                        <li>Nie tolerujemy treści pornograficznych ani nieodpowiednich.</li>
                        <li>W przypadku naruszenia regulaminu mogą zostać podjęte kroki moderacyjne.</li>
                    </ul>
                    <div className="join-button-wrapper">
                        <button className="join-chat-button" onClick={handleJoin}>
                            Dołącz do czatu
                        </button>
                    </div>
                </div>}
            </div>
            {
                modalStateEmpty ?
                    <div className="modal-wrapper-empty">
                        <p>Nie można wysyłąć pustych wiadomości. Napisz coś :((</p>
                        <hr className="modal-line"/>
                        <div className="modal-button-wrapper">
                            <button className="modal-button" onClick={closeEmptyModal}>Ok</button>
                        </div>
                    </div> : null
            }
        </div>

    );
}

export default App;
