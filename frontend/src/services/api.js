import axios from "axios";

const api = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:3000",
	withCredentials: true,
});

export const openApi = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:3000",
});

export default api;
