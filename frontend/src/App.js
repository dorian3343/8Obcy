import React, {useEffect, useState} from 'react';
import Header from "./Components/header/header";
import UMessage from "./Components/message/uMessage";
import CryptoJS from "crypto-js";
import PMessage from "./Components/message/pMessage";
import './App.css'
import WsMessage from "./Ws/template";
import generateUniqueId from "./Utils/generateId";
import Chat from "./Components/chat/chat";
import Modal from "./Components/modal/modal";
let socket;
//Variable to control the typing popup
let initialTimeoutDuration = 1000;

function App() {

    const [getUserCount,setUserCount] = useState(0)

    const [getModalStates, setModalStates] = useState({
        modalStatePartner: false,
        modalStateEmpty: false,
        popupPartnerTyping: false,
        modalStateError:false,
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

    function resetStates() {
        setUserCount(0);
        setModalStates({
            modalStatePartner: false,
            modalStateEmpty: false,
            popupPartnerTyping: false,
            modalStateError:false,
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

    //Focus the text input on start
    useEffect(() => {
        if (getChatStates.withPartner) {
            document.getElementById("main-input").focus()
        }
    }, [getChatStates.withPartner]);
    //Get user count before switching to ws
    useEffect(() => {
        fetch('http://localhost:4200/count')
            .then((response) => response.json())
            .then((json) => {
                setUserCount(json.Count)
            });
    }, [setUserCount]);



    function handleChange(event) {
        setMessageStates(prevState => ({ ...prevState, message: event.target.value }));
    }


    function handleJoin() {
        setChatStates(prevState => ({ ...prevState, inChat: true }));

        socket = createWebSocket();
        setupSocketListeners(socket);
    }

    function createWebSocket() {
        const newSocket = new WebSocket('ws://localhost:4200/ws');
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
                fetch('http://localhost:3069/assign', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ key: data.Contents }),
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        sessionStorage.setItem('AESKey', data.aes_key);

                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                        resetStates()
                    });
            }else if (data.RequestType === "PartnerTyping") {
                setModalStates(prevState => ({
                    ...prevState,
                    popupPartnerTyping: true,
                }));
                setTimeout(() => {
                    setModalStates(prevState => ({
                        ...prevState,
                        popupPartnerTyping: false,
                    }));
                }, initialTimeoutDuration);
                initialTimeoutDuration += 3000;
            }

            if (data.Contents === "Found Partner") {

                setChatStates(prevState => ({ ...prevState,
                    status: "Rozpoczęto rozmowę z obcym.. przywitaj się, napisz „hej” :)",
                    withPartner: true }));
                document.getElementById("main-input").focus()

            }
    }

    function handlePartnerMessage(data) {
        const AES = sessionStorage.getItem('AESKey');
        if (AES) {
            const decryptedMessage = CryptoJS.AES.decrypt(data.Contents, AES).toString(CryptoJS.enc.Utf8);
            setMessageStates((prevState) => ({
                ...prevState,
                messages: [
                    ...prevState.messages,
                    <PMessage key={generateUniqueId()} message={decryptedMessage}></PMessage>,
                ],
            }));
        }
    }




    function handleError(data) {
        if (data.Contents === "Error! Partner Disconnected") {
            sessionStorage.clear()
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
        sessionStorage.clear()
        socket.send(JSON.stringify(new WsMessage("SystemMessage", "Close", "")));
    }


    function handleKeyDown(event) {
        switch (event.key) {
            case 'Enter':
                handleSend();
                document.getElementById("main-input").blur();
                break;
            case 'Escape':
                handleLeave();
                break;
            default:
                if (socket !== undefined){
                    socket.send(JSON.stringify(new WsMessage("UserMessage", "Typing", "")));
                }
                break;
        }
    }

    function handleLeave() {
        if (getMessageStates.leaveMessage === "Rozłącz się") {
            setMessageStates(prevState => ({ ...prevState, leaveMessage: "Napewno?" }));
        } else {
            socket.send(JSON.stringify(new WsMessage("SystemMessage", "Close", "")));
            resetStates()
        }
    }

    function closeEmptyModal() {
        setModalStates(prevState => ({ ...prevState, modalStateEmpty: false }));
    }
    function closeErrorModal() {
        setModalStates(prevState => ({ ...prevState, modalStateError: false }));
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
            const AES = sessionStorage.getItem('AESKey');
            if (AES) {
                const encryptedMessage = CryptoJS.AES.encrypt(getMessageStates.message.toString(), AES).toString();
                const wsMessage = new WsMessage("UserMessage", "ToPartner", encryptedMessage);
                const jsonString = JSON.stringify(wsMessage);

                socket.send(jsonString);
            }

        } else {
           resetStates()
            setModalStates(prevState => ({
                ...prevState,
                modalStateError: true,
            }));
        }
    }


    return (
        <div>
            <Header UserCount={getUserCount}></Header>
            <br/>
            <div className="app-main-wrapper">
                {getChatStates.inChat ? <div>
                        <div className="chat-wrapper">
                            <Chat chatStatus={getChatStates.status} messages={getMessageStates.messages} showTyping={getModalStates.popupPartnerTyping}/>
                        </div>
                        <div className="input-wrapper">
                            <div className="button-wrapper" id="buttonLeave" onClick={handleLeave}>
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
                   <Modal messageTop="Nie można wysyłać pustych wiadomości"  onClose={closeEmptyModal()} />
                   :  null
            }

            {
                getModalStates.modalStatePartner ?
                    <Modal messageTop="Obcy sie rozłączył :(("  onClose={closePartnerModal} />
                    : null
            }


            {
                getModalStates.modalStateError ?
                    <Modal messageTop="Coś poszło nie tak po naszej stronie!" messageBottom="Przepraszamy :(" onClose={closeErrorModal} />
                    : null
            }
        </div>

    );
}

export default App;
