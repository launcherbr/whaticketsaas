import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const useContacts = ({ searchParam, pageNumber, date, dateStart, dateEnd }) => {
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchContacts = async () => {
                try {
                    const { data } = await api.get("/contacts", {
                        params: {
                            searchParam,
                            pageNumber,
                            date,
                            dateStart,
                            dateEnd,
                        },
                    });
                    setContacts(data.contacts);

                    setHasMore(data.hasMore);
                    setCount(data.count);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                    toastError(err);
                }
            };

            fetchContacts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber, date, dateStart, dateEnd]);

    return { contacts, loading, hasMore, count };
};

export default useContacts;
