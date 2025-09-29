import api from "../../services/api";

const useVersion = () => {

    const getVersion = async () => {
        const { data } = await api.request({
            url: '/version',
            method: 'GET',
        });
        return data;
    }

    return {
        getVersion
    }
}

export default useVersion;



