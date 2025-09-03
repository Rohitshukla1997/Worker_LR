import { api } from "../../../lib/services/api_services";
import { formatDateToDDMMYYYY } from '../../../customhooks/useFormattedDate'

// get api
export const fetchTpPassData = async () => {
    try {
        const response = await api.get(`/lorry-receipt/get-all-lorry-receipt`);
        const rawData = response ?? [];
        // console.log("rawData", rawData);

        // Map raw API data to formatted objects
        const formattedData = rawData.map((tpPass) => ({
            id: tpPass._id,
            date: formatDateToDDMMYYYY(tpPass.date),
            originalDate: tpPass.date,
            supervisorId: tpPass.supervisorId || "Supervisor ID",
            supervisorName: tpPass.supervisorName || "Supervisor",
            workerName: tpPass?.workerId?.name || "No Worker Found",
            workerId: tpPass?.workerId?._id || "No Worker Found",
            companyName: tpPass.companyName || "Unknown",
            companyAddress: tpPass.companyAddress || "Unknown",
            companyEmail: tpPass.companyEmail || "Unknown",
            gstIn: tpPass.gstIn || "Unknown",
            companyOfficeNumber: tpPass.companyOfficeNumber || "Unknown",
            companyMobileNumber: tpPass.companyMobileNumber || "Unknown",
            lorryNumber: tpPass.lorryNumber || "Unknown",
            vehicleName: tpPass.vehicleName || "Unknown",
            vehicleId: tpPass.vehicleId || "Unknown",
            ownerName: tpPass.ownerName || "Unknown",
            consignorName: tpPass.consignorName || "Unknown",
            consignorAddress: tpPass.consignorAddress || "Unknown",
            consigneeName: tpPass.consigneeName || "Unknown",
            consigneeAddress: tpPass.consigneeAddress || "Unknown",
            customerName: tpPass.customerName || "Unknown",
            customerAddress: tpPass.customerAddress || "Unknown",
            startLocation: tpPass.from || tpPass.startLocation || "Unknown",
            endLocation: tpPass.to || tpPass.endLocation || "Unknown",
            driverName: tpPass.driverId?.name || "N/A",
            driverId: tpPass.driverId?._id || "N/A",
            supervisor: tpPass.driverId?.supervisor || "N/A",
            driverContact: tpPass.driverId?.contactNumber || "N/A",
            containerNumber: tpPass.containerNumber || "Unknown",
            sealNumber: tpPass.sealNumber || "Unknown",
            itemName: tpPass.itemName || "Unknown",
            itemQuantity: tpPass.itemQuantity || "Unknown",
            itemUnit: tpPass.itemUnit || "Unknown",
            itemWeight: tpPass.itemWeight || "Unknown",
            itemcost: tpPass.itemcost || "Unknown",
            customerRate: tpPass.customerRate || "Unknown",
            totalAmount: tpPass.totalAmount || "Unknown",
            transporterRate: tpPass.transporterRate || "Unknown",
            totalTransporterAmount: tpPass.totalTransporterAmount || "Unknown",
            transporterRate: tpPass.transporterRate || "Unknown",
            customerRateOn: tpPass.customerRateOn || "Unknown",
            customerRate: tpPass.customerRate || "Unkonwn",
            customerFreight: tpPass.customerFreight || "Unknown",
            transporterFreight: tpPass.transporterFreight || "Unknown",
        }));
        // console.log(response);

        return formattedData;
    } catch (err) {
        console.error("Error fetching TP Pass data:", err);
        return [];
    }
};

// Post api
export const postLorryReciptApi = async (lorryrecipt) => {
    try {
        const response = await api.post(
            `${import.meta.env.VITE_API_URL}/api/lorry-receipt/create`,
            lorryrecipt
        );

        // Return response data for any successful request
        return response.data;
    } catch (error) {
        // Axios error with response
        if (error.response) {
            console.error("API Error:", error.response.data.message || error.message);
            throw error.response.data;
        } else {
            // Network or other errors
            console.error("API Error:", error.message);
            throw { message: error.message };
        }
    }
};


// Patch API
export const patchLorryReciptApi = async (id, updatelr) => {
    try {
        const response = await api.patch(
            `${import.meta.env.VITE_API_URL}/api/lorry-receipt/update/${id}`,
            updatelr
        );

        // Always return response data if request is successful
        console.log("Updated LR data", response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            // Server responded with a non-2xx status
            console.error("API Error:", error.response.data.message || error.message);
            throw error.response.data;
        } else {
            // Network error or other
            console.error("API Error:", error.message);
            throw { message: error.message };
        }
    }
};




// DELETE API  

export const deleteLorryReciptApi = async (id) => {
    try {
        const response = await api.delete(
            `${import.meta.env.VITE_API_URL}/api/lorry-receipt/delete/${id}`,
        );
        console.log("This is Lorry Recipt Delete List by ID : ", response.data);
        return response.data;
    } catch (error) {
        console.error("Error:", error.message?.data || error.message);
        throw error;
    }
}


// Vehicle fetch

export const VehicleApi = async () => {
    try {
        const response = await api.get(
            `${import.meta.env.VITE_API_URL}/api/vehicle/get-all`
        );

        // Always use response.data, not response
        const rawData = response?.devices ?? [];

        // Format into dropdown-friendly objects
        const formattedData = rawData.map((vehicle) => ({
            id: vehicle._id,
            name: vehicle.name || "Unknown",
        }));

        return formattedData;
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return [];
    }
};



console.log("Vehicle it", VehicleApi())

//  Driver fetch

export const DriverApi = async () => {
    try {
        const response = await api.get(
            `${import.meta.env.VITE_API_URL}/api/drivers/all`
        );

        // API returns array directly
        const rawData = response ?? [];

        // Format for dropdown
        const formattedData = rawData.map((driver) => ({
            id: driver._id,
            name: driver.name || "Unknown",
            supervisor: driver.supervisor || "Unknown",
        }));

        return formattedData;
    } catch (error) {
        console.error("Error fetching drivers:", error);
        return [];
    }
};

console.log("driver api", DriverApi())


