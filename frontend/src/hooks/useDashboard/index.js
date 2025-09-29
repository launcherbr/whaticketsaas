import api from "../../services/api";

const useDashboard = () => {

    const find = async (params) => {
        const { data } = await api.request({
            url: `/dashboard`,
            method: 'GET',
            params
        });
        return data;
    }
    const getReport = async (params) => {
        const { data } = await api.request({
            url: `/ticket/reports`,
            method: 'GET',
            params
        });
        return data;
    }
    return {
        find,
        getReport
    }
}

export default useDashboard;