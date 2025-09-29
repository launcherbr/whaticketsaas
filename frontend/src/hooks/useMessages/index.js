import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const useMessages = ({ fromMe, dateStart, dateEnd }) => {
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchMessages = async () => {
                try {
                    const { data } = await api.get("/messages-allMe", {
                        params: {
                            fromMe,
                            dateStart,
                            dateEnd,
                        },
                    });
                    setCount(data.count[0].count);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                    toastError(err);
                }
            };

            fetchMessages();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [dateStart, dateEnd]);

    return { count };
};

export default useMessages;
