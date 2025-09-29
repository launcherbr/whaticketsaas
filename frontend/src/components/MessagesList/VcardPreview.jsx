import React from 'react';
import { parse } from 'vcard-parser';
const vcardStyle = {
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    width: '300px',
    margin: '20px auto',
};

const infoStyle = {
    margin: '5px 0',
};

const VcardPreview = ({ messageBody }) => {
    console.log('messageBody', messageBody);
    const vcardObject = parse(messageBody);
    const contact = vcardObject.FN;
    const number = vcardObject.TEL.value;
    return (
        <div>
            <h2>Preview do Cartão de Contato</h2>
            <div>
                <p style={infoStyle}>Nome: {contact}</p>
                <p style={infoStyle}>Número de WhatsApp: {number}</p>
            </div>
        </div>
    );
};

export default VcardPreview;
