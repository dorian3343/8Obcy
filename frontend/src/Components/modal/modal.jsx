import React from "react";

function  Modal({messageTop,messageBottom,onClose}) {
    return (
        <div className="modal-wrapper-empty">
            <p>{messageTop}</p>
            {messageBottom !== undefined ? <p>{messageBottom}</p> : null}


            <hr className="modal-line"/>
            <div className="modal-button-wrapper">
                <button className="modal-button" onClick={onClose}>Ok</button>
            </div>
        </div>
    );

}

export default Modal