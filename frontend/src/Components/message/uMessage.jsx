// Pear message
function UMessage({ message }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <p style={{ margin: '0', marginRight: '5px',color:"#A0B85A",fontWeight:"bolder" }}>Ty:</p>
            <p style={{ margin: '0' }}> {message}</p>
        </div>
    );
}

export default UMessage;

