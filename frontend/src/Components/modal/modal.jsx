import React from "react";
import './modal.css'
function  Modal({messageTop,messageBottom,mainButtonFunction,mainButtonText,secondaryButtonText,secondaryButtonFunction}) {
    return (
        <div className="modal-wrapper-empty">
            <p>{messageTop}</p>
            {messageBottom !== undefined ? <p>{messageBottom}</p> : null}


            <hr className="modal-line"/>
            <div className="modal-button-wrapper">
                <div className="button-div">
                    <button className="modal-button" onClick={mainButtonFunction}>{mainButtonText}</button>
                </div>
                {
                    (secondaryButtonFunction !== undefined && secondaryButtonText !== undefined)? <div className="button-div">
                            <button className="modal-button"
                                    onClick={secondaryButtonFunction}>{secondaryButtonText}</button>
                        </div> : null
                }

            </div>
        </div>
    );

}

export default Modal