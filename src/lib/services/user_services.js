import authAxios from "../authAxios";

export const loginUser = async (phone, password) => {
    const response = await authAxios.post("/login", {
        phone,
        password,
    });
    return response.data;
};
