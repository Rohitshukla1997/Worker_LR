import { api } from "../../lib/services/api_services";

export const EmpyoleeProfileApi = async () => {
    try {
        const response = await api.get(
            `${import.meta.env.VITE_API_URL}/api/worker/get-profile`
        );

        if (!response) return null;

        // Format single profile object
        return {
            id: response._id,
            name: response.name || "Unknown",
            supervisorName: response.supervisorName || "Unknown",
            email: response.email || "N/A",
            phone: response.phone || "N/A",
            profileImage: response.profileImage?.base64Data
                ? `data:${response.profileImage.contentType};base64,${response.profileImage.base64Data}`
                : null,
            position: response.position || "Employee",
        };
    } catch (error) {
        console.error("Error fetching employee profile:", error);
        return null;
    }
};
