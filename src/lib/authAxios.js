import axios from "../lib/axios";

const authAxios = axios.create({
    baseURL: import.meta.env.VITE_API_URL + "/api/worker",
    headers: {
        "Content-Type": "application/json",
    },
});

export default authAxios;
