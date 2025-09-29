import axios from "axios";

const api = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:3250",
	withCredentials: true,
});

export const openApi = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:3250",
});

export default api;
