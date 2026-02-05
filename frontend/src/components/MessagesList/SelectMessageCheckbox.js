import React, { useContext, useEffect } from "react";
import { Checkbox } from "@mui/material";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";

const SelectMessageCheckbox = ({ message }) => {
    const { showSelectMessageCheckbox, selectedMessages, setSelectedMessages, resetSelection } = useContext(ForwardMessageContext);

    // Verifica se a mensagem está na lista de selecionadas
    const isChecked = selectedMessages.some((m) => m.id === message.id);

    const handleSelectMessage = (e) => {
        e.stopPropagation();
        
        if (e.target.checked) {
            if (!selectedMessages.some((m) => m.id === message.id)) {
                setSelectedMessages([...selectedMessages, message]);
            }
        } else {
            setSelectedMessages(selectedMessages.filter((m) => m.id !== message.id));
        }
    };

    // Reseta o checkbox quando o resetSelection é chamado
    useEffect(() => {
        if (!showSelectMessageCheckbox) {
            setSelectedMessages([]);  // Limpa a seleção se o checkbox for ocultado
        }
    }, [showSelectMessageCheckbox, setSelectedMessages]);

    if (!showSelectMessageCheckbox) {
        return null;
    }

    return <Checkbox color="primary" checked={isChecked} onChange={handleSelectMessage} />;
};

export default SelectMessageCheckbox;
