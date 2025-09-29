/** 
 * @TercioSantos-1 |
 * api/get/todas as configurações de 1 empresa |
 * api/get/1 configuração específica |
 * api/put/atualização de 1 configuração |
 */
import api from "../../services/api";

const useCompanySettings = () => {

    const getAll = async (companyId) => {
        const { data } = await api.request({
            url: `/companySettings/${companyId}`,
            method: 'GET'
        });

        return data;
    }

   const get = async (params) => {
        const { data } = await api.request({
            url: '/companySettingOne',
            method: 'GET',
            params
        });
        return data;
    } 

    const update = async (data) => {
        const { data: responseData } = await api.request({
            url: '/companySettings',
            method: 'PUT',
            data
        });
        return responseData;
    }

    return {
        getAll,
        get,
        update
    }
}

export default useCompanySettings;