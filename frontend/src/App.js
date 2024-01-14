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

function decrypt(ciphertext, key) {
    let decryptedText = '';
    for (let i = 0; i < ciphertext.length; i++) {
        let charCode = ciphertext.charCodeAt(i);
        if (ciphertext[i].match(/[a-zA-Z]/)) {
            // Adjust the shift for uppercase and lowercase letters
            let isUpperCase = ciphertext[i] === ciphertext[i].toUpperCase();
            charCode = ((charCode - (isUpperCase ? 65 : 97) - key + 26) % 26) + (isUpperCase ? 65 : 97)-3;
        }
        decryptedText += String.fromCharCode(charCode);
    }
    return decryptedText;
}



function App() {

    useEffect(() => {
        fetch('http://localhost:8080/count')
            .then((response) => response.json())
            .then((json) => {
                setState(prevState => ({ ...prevState, userCount: json.Count }));
            });
    }, []);


    const [state, setState] = useState({
        userCount: 0,
        messages: [],
        status: "Szukanie rozmówce. . .",
        leaveMessage: "Rozłącz się",
        inChat: false,
        message: "",
        modalStatePartner: false,
        modalStateEmpty: false,
        partner: false,
        key: 0
    });

    function handleChange(event) {
        setState(prevState => ({ ...prevState, message: event.target.value }));
    }


    function handleJoin() {
        setState(prevState => ({ ...prevState, inChat: true }));
        socket = createWebSocket();

        setupSocketListeners(socket);
    }

    function createWebSocket() {
        const newSocket = new WebSocket('ws://localhost:8080/ws');
        newSocket.addEventListener('open', () => {
            if (newSocket.readyState === WebSocket.OPEN) {
                newSocket.send(JSON.stringify(new WsMessage("UserMessage", "FindPartner", "")));
            }
        });
        return newSocket;
    }

    function setupSocketListeners(socket) {
        socket.addEventListener('message', handleMessage);
        socket.addEventListener('close', handleClose);
    }

    function handleMessage(event) {
        const data = JSON.parse(event.data);
        if (data.MessageType === "SystemMessage") {
            handleSystemMessage(data);
        } else if (data.MessageType === "PartnerMessage") {
            handlePartnerMessage(data);
        } else if (data.MessageType === "Error") {
            handleError(data);
        }
    }

    function handleSystemMessage(data) {
        setState(prevState => {
            let newState = { ...prevState };

            if (data.RequestType === "UpdateCount") {
                newState.userCount = data.Contents;
            } else if (data.RequestType === "SetEncKey") {
                newState.key = data.Contents;
            }

            if (data.Contents === "Found Partner") {
                newState.status = "Rozpoczęto rozmowę z obcym.. przywitaj się, napisz „hej” :)";
                newState.partner = true;
            }

            return newState;
        });
    }

    function handlePartnerMessage(data) {
        setState(prevState => ({
            ...prevState,
            messages: [...prevState.messages, <PMessage key={generateUniqueId()} message={decrypt(data.Contents,state.key)}></PMessage>],
        }));
    }



    function handleError(data) {
        if (data.Contents === "Error! Partner Disconnected") {
            setState(prevState => ({
                ...prevState,
                modalStatePartner: true,
                status: "Zakończono rozmowe z obcym...",
                partner: false,
            }));
        }
    }


    function handleClose() {
        socket.send(JSON.stringify(new WsMessage("SystemMessage", "Close", "")));
    }


    function handleKeyDown(event) {
        switch (event.key) {
            case 'Enter':
                handleSend();
                break;
            case 'Escape':
                handleEscapeKey();
                break;
            default:
                break;
        }
    }

    function handleEscapeKey() {
        if (state.leaveMessage === "Rozłącz się") {
            setState(prevState => ({ ...prevState, leaveMessage: "Napewno?" }));
        } else {
            socket.send(JSON.stringify(new WsMessage("SystemMessage", "Close", "")));
            socket.close();

            setState({
                userCount: 0,
                messages: [],
                status: "Szukanie rozmówce. . .",
                leaveMessage: "Rozłącz się",
                inChat: false,
                message: "",
                modalStatePartner: false,
                modalStateEmpty: false,
                partner: false,
                key: 0
            });
        }
    }

    function closeEmptyModal() {
        setState(prevState => ({ ...prevState, modalStateEmpty: false }));
    }

    function closePartnerModal() {
        setState({
            userCount: 0,
            messages: [],
            status: "Szukanie rozmówce. . .",
            leaveMessage: "Rozłącz się",
            inChat: false,
            message: "",
            modalStatePartner: false,
            modalStateEmpty: false,
            partner: false,
            key: 0
        });

        handleJoin();
    }


    function handleSend() {
        const regex = /^[ \n]*$/;

        if (regex.test(state.message)) {
            setState(prevState => ({ ...prevState, modalStateEmpty: true }));
            return;
        }

        const newMessages = [...state.messages, <UMessage key={generateUniqueId()} message={state.message}></UMessage>];

        setState(prevState => ({
            ...prevState,
            messages: newMessages,
            message: "",
        }));

        document.getElementById("main-input").value = "";

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(new WsMessage("UserMessage", "ToPartner", state.message)));
        } else {
            console.error('WebSocket connection is not open.');
        }
    }


    return (
        <div>
            <Header UserCount={state.userCount}></Header>
            <br/>
            <div className="app-main-wrapper">
                {state.inChat ? <div>
                        <div className="content-wrapper">
                            <p style={{fontSize: '1.2em', fontWeight: 'bolder'}}>{state.status}</p>
                            {state.messages.map((message, index) => (
                                <div key={index} className="content-item">
                                    {message}
                                </div>
                            ))}
                        </div>
                        <div className="input-wrapper">
                            <div className="button-wrapper" id="buttonLeave">
                                <p>{state.leaveMessage}</p>
                                <p style={{color: "#9E8F6D"}}>ESC</p>
                            </div>
                            <div className="text-input-wrapper">
                                <textarea disabled={!state.partner} className="text-input" placeholder="Cześć..."
                                          id="main-input" onKeyDown={handleKeyDown} onChange={handleChange}/>

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
               state.modalStateEmpty ?
                    <div className="modal-wrapper-empty">
                        <p>Nie można wysyłąć pustych wiadomości. Napisz coś :((</p>
                        <hr className="modal-line"/>
                        <div className="modal-button-wrapper">
                            <button className="modal-button" onClick={closeEmptyModal}>Ok</button>
                        </div>
                    </div> : null
            }

            {
                state.modalStatePartner ?
                    <div className="modal-wrapper-empty">
                        <p>Obcy sie rozłączył :((</p>
                        <hr className="modal-line"/>
                        <div className="modal-button-wrapper">
                            <button className="modal-button" onClick={closePartnerModal}>Ok</button>
                        </div>
                    </div> : null
            }
        </div>

    );
}

export default App;
