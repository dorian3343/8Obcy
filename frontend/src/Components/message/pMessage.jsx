// Pear message
function PMessage({ message }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center'}}>
            <p style={{ margin: '0', marginRight: '5px',color:"#6792D6",fontWeight:"bolder" }}>Obcy:</p>
            <p style={{ margin: '0' }}> {message}</p>
        </div>
    );
}

export default PMessage;

