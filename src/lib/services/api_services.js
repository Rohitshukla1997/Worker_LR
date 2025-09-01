import axios from "../axios";

export const api = {
    get: async (url, params) => {
        const response = await axios.get(url, { params });
        return response.data;
    },

    post: async (url, data) => {
        const response = await axios.post(url, data);
        return response.data;
    },

    put: async (url, data) => {
        const response = await axios.put(url, data);
        return response.data;
    },

    patch: async (url, data) => {
        const response = await axios.patch(url, data);
        return response.data;
    },

    delete: async (url, params) => {
        const response = await axios.delete(url, { params });
        return response.data;
    },

    mulDelete: async (url, data) => {
        const response = await axios.delete(url, { data });
        return response.data;
    },
};
