import React, { useState, createContext } from "react";

const QueueSelectedContext = createContext();

const QueueSelectedProvider = ({ children }) => {
	const [selectedQueuesMessage, setSelectedQueuesMessage] = useState([]);
	return (
		<QueueSelectedContext.Provider
			value={{ selectedQueuesMessage, setSelectedQueuesMessage }}
		>
			{children}
		</QueueSelectedContext.Provider>
	);
};

export { QueueSelectedContext, QueueSelectedProvider };
