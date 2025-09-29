import React, { useState, createContext } from "react";

const ForwardMessageContext = createContext();

const ForwardMessageProvider = ({ children }) => {
	const [showSelectMessageCheckbox, setShowSelectMessageCheckbox] = useState(false);
	const [selectedMessages, setSelectedMessages] = useState([]);
	const [forwardMessageModalOpen, setForwardMessageModalOpen] = useState(false);

	// Função para limpar a seleção e esconder os checkboxes
	const resetSelection = () => {
		setSelectedMessages([]);
		setShowSelectMessageCheckbox(false);
	};

	return (
		<ForwardMessageContext.Provider
			value={{
				showSelectMessageCheckbox,
				setShowSelectMessageCheckbox,
				selectedMessages,
				setSelectedMessages,
				forwardMessageModalOpen,
				setForwardMessageModalOpen,
				resetSelection, // Adiciona resetSelection ao contexto
			}}
		>
			{children}
		</ForwardMessageContext.Provider>
	);
};

export { ForwardMessageContext, ForwardMessageProvider };
