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
            transporterRateOn: tpPass.transporterRateOn || "Unknown",
            customerRateOn: tpPass.customerRateOn || "Unknown",
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
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/lorry-receipt/create`,
            lorryrecipt,
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status === 201 || response.status === 200) {
            console.log("post TP data", response.data)
            return response.data;
        } else {
            throw new Error(`Unexpected response status: ${response.status}`);
        }
    } catch (error) {
        console.error("API Error:", error.response?.data?.message || error.message);
        throw error;
    }
}

// patch api

export const patchLorryReciptApi = async (id, updatelr) => {
    try {
        const response = await axios.patch(
            `${import.meta.env.VITE_API_URL}/api/lorry-receipt/update/${id}`,
            updatelr,
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status === 201 || response.status === 200) {
            console.log("Updated LR data", response.data)
            return response.data;
        } else {
            throw new Error(`Unexpected response status: ${response.status}`);
        }
    } catch (error) {
        console.error("API Error:", error.response?.data?.message || error.message);
        throw error;
    }
}


// DELETE API  

export const deleteLorryReciptApi = async (id) => {
    try {
        const response = await axios.delete(
            `${import.meta.env.VITE_API_URL}/api/lorry-receipt/delete/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                },
            }
        );
        console.log("This is Lorry Recipt Delete List by ID : ", response.data);
        return response.data;
    } catch (error) {
        console.error("Error:", error.message?.data || error.message);
        throw error;
    }
}
