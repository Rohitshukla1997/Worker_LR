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
            companyId: tpPass.companyId?.id || "No Worker Found",
            companyName: tpPass.companyId?.companyName || "N/A",
            companyAddress: tpPass.companyId?.address || "N/A",
            companyEmail: tpPass.companyId?.email || "N/A",
            gstIn: tpPass.companyId?.gstNumber || "N/A",
            companyOfficeNumber: tpPass.companyId?.mobileNumber || "N/A",
            companyMobileNumber: tpPass.companyId?.officeNumber || "N/A",
            lorryNumber: tpPass.lorryNumber || "N/A",
            vehicleName: tpPass.vehicleName || "N/A",
            vehicleId: tpPass.vehicleId || "N/A",
            ownerName: tpPass.ownerName || "N/A",
            consignorName: tpPass.consignorName || "N/A",
            consignorAddress: tpPass.consignorAddress || "N/A",
            consigneeName: tpPass.consigneeName || "N/A",
            consigneeAddress: tpPass.consigneeAddress || "N/A",
            customerName: tpPass.customerName || "N/A",
            customerAddress: tpPass.customerAddress || "N/A",
            startLocation: tpPass.from || tpPass.startLocation || "N/A",
            endLocation: tpPass.to || tpPass.endLocation || "N/A",
            driverName: tpPass.driverName || "N/A",
            driverId: tpPass.driverId?._id || "N/A",
            supervisor: tpPass.driverId?.supervisor || "N/A",
            driverContact: tpPass.driverId?.contactNumber || "N/A",
            containerNumber: tpPass.containerNumber || "N/A",
            sealNumber: tpPass.sealNumber || "N/A",
            itemName: tpPass.itemName || "N/A",
            itemQuantity: tpPass.itemQuantity || "N/A",
            itemUnit: tpPass.itemUnit || "N/A",
            itemWeight: tpPass.itemWeight || "N/A",
            itemcost: tpPass.itemcost || "N/A",
            customerRate: tpPass.customerRate || "N/A",
            totalAmount: tpPass.totalAmount || "N/A",
            transporterRate: tpPass.transporterRate || "N/A",
            totalTransporterAmount: tpPass.totalTransporterAmount || "N/A",
            transporterRate: tpPass.transporterRate || "N/A",
            transporterRateOn: tpPass.transporterRateOn || "N/A",
            customerRateOn: tpPass.customerRateOn || "N/A",
            customerRate: tpPass.customerRate || "Unkonwn",
            customerFreight: tpPass.customerFreight || "N/A",
            transporterFreight: tpPass.transporterFreight || "N/A",
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
            name: vehicle.name || "N/A",
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
            name: driver.name || "N/A",
            supervisor: driver.supervisor || "N/A",
        }));

        return formattedData;
    } catch (error) {
        console.error("Error fetching drivers:", error);
        return [];
    }
};

console.log("driver api", DriverApi())


// Company name get api

export const getCompanyNameApi = async () => {
    try {
        const response = await api.get(
            `${import.meta.env.VITE_API_URL}/api/company/get-all`
        );

        console.log("All Company Data:", response.data);

        const rawData = response ?? [];

        const formattedData = rawData.map((company) => ({
            id: company._id,
            companyName: company.companyName || "N/A",
            email: company.email || "N/A",
            mobileNumber: company.mobileNumber || "N/A",
            officeNumber: company.officeNumber || "N/A",
            address: company.address || "N/A",
            gstNumber: company.gstNumber || "N/A",
            supervisor: company.supervisorId || "N/A",
        }));

        return formattedData;
    } catch (error) {
        console.error("Error fetching companies:", error);
        return [];
    }
};


