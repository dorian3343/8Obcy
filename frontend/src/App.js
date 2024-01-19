import React, {useEffect, useState} from 'react';
import Header from "./Components/header/header";
import UMessage from "./Components/message/uMessage";
import PMessage from "./Components/message/pMessage";
import './App.css'
import decrypt from "./Utils/decrypt";
import WsMessage from "./Ws/template";
import generateUniqueId from "./Utils/generateId";
let socket;


function App() {
    function resetStates() {
        setKey(0);
        setUserCount(0);
        setModalStates({
            modalStatePartner: false,
            modalStateEmpty: false,
        });
        setChatStates({
            status: "Szukanie rozmówce. . .",
            withPartner: false,
            inChat: false,
        });
        setMessageStates({
            messages: [],
            message: "",
            leaveMessage: "Rozłącz się",
        });
    };

    useEffect(() => {
        fetch('http://localhost:8080/count')
            .then((response) => response.json())
            .then((json) => {
                setUserCount(json.Count)
            });
    }, []);

    //Key for decrypting messages
    const [getKey, setKey] = useState(0)

    const [getUserCount,setUserCount] = useState(0)

    const [getModalStates, setModalStates] = useState({
        modalStatePartner: false,
        modalStateEmpty: false,
    })
    const [getChatStates,setChatStates] = useState({
        status: "Szukanie rozmówce. . .",
        withPartner: false,
        inChat: false,
    })
    const [getMessageStates,setMessageStates] = useState({
        messages: [],
        message: "",
        leaveMessage: "Rozłącz się",
    })

    function handleChange(event) {
        setMessageStates(prevState => ({ ...prevState, message: event.target.value }));
    }


    function handleJoin() {
        setChatStates(prevState => ({ ...prevState, inChat: true }));

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
            if (data.RequestType === "UpdateCount") {
                setUserCount(data.Contents)
            } else if (data.RequestType === "SetEncKey") {
                 setKey(data.Contents);
            }

            if (data.Contents === "Found Partner") {
                setChatStates(prevState => ({ ...prevState,
                    status: "Rozpoczęto rozmowę z obcym.. przywitaj się, napisz „hej” :)",
                    withPartner: true }));
            }
    }

    function handlePartnerMessage(data) {
        setMessageStates(prevState => ({
            ...prevState,
            messages: [...prevState.messages, <PMessage key={generateUniqueId()} message={decrypt(data.Contents,getKey)}></PMessage>],
        }));
    }



    function handleError(data) {
        if (data.Contents === "Error! Partner Disconnected") {

            setModalStates(prevState => ({
                ...prevState,
                modalStatePartner: true,
            }));
            setChatStates(prevState => ({
                ...prevState,
                status: "Zakończono rozmowe z obcym...",
                withPartner: false,
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
        if (getMessageStates.leaveMessage === "Rozłącz się") {
            setMessageStates(prevState => ({ ...prevState, leaveMessage: "Napewno?" }));
        } else {
            socket.send(JSON.stringify(new WsMessage("SystemMessage", "Close", "")));
            socket.close();
            resetStates()
        }
    }

    function closeEmptyModal() {
        setModalStates(prevState => ({ ...prevState, modalStateEmpty: false }));
    }

    function closePartnerModal() {
        resetStates()
        handleJoin();
    }


    function handleSend() {
        const regex = /^[ \n]*$/;

        if (regex.test(getMessageStates.message)) {
            setModalStates(prevState => ({ ...prevState, modalStateEmpty: true }));
            return;
        }

        const newMessages = [...getMessageStates.messages, <UMessage key={generateUniqueId()} message={getMessageStates.message}></UMessage>];

        setMessageStates(prevState => ({
            ...prevState,
            messages: newMessages,
            message: "",
        }));

        document.getElementById("main-input").value = "";

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(new WsMessage("UserMessage", "ToPartner", getMessageStates.message)));
        } else {
            console.error('WebSocket connection is not open.');
        }
    }


    return (
        <div>
            <Header UserCount={getUserCount}></Header>
            <br/>
            <div className="app-main-wrapper">
                {getChatStates.inChat ? <div>
                        <div className="content-wrapper">
                            <p style={{fontSize: '1.2em', fontWeight: 'bolder'}}>{getChatStates.status}</p>
                            {getMessageStates.messages.map((message, index) => (
                                <div key={index} className="content-item">
                                    {message}
                                </div>
                            ))}
                        </div>
                        <div className="input-wrapper">
                            <div className="button-wrapper" id="buttonLeave">
                                <p>{getMessageStates.leaveMessage}</p>
                                <p style={{color: "#9E8F6D"}}>ESC</p>
                            </div>
                            <div className="text-input-wrapper">
                                <textarea disabled={!getChatStates.withPartner} className="text-input" placeholder="Cześć..."
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
               getModalStates.modalStateEmpty ?
                    <div className="modal-wrapper-empty">
                        <p>Nie można wysyłąć pustych wiadomości. Napisz coś :((</p>
                        <hr className="modal-line"/>
                        <div className="modal-button-wrapper">
                            <button className="modal-button" onClick={closeEmptyModal}>Ok</button>
                        </div>
                    </div> : null
            }

            {
                getModalStates.modalStatePartner ?
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
