import { api } from "../../../lib/services/api_services";
import { formatDateToDDMMYYYY } from '../../../customhooks/useFormattedDate'
import { useEffect } from "react";


// This is godown section
export const GetGodownApi = async ({ queryKey }) => {
    const [_key, { search, page, limit }] = queryKey;

    const { data } = await api.get(
        `${import.meta.env.VITE_API_URL}/api/warehouse/get`,
        {
            params: { search, page, limit },
        }
    );

    return {
        data: data.map((item) => ({
            id: item._id,
            wareHouseName: item.wareHouseName || "Unknown",
            location: item.location || "Unknown",
        })),
        total: data.total,
        totalPages: data.totalPages,
        page: data.page,
    };
};


// warehouse profile by id

export const getWarehouseProfileApi = async ({ queryKey }) => {
    const [_key, { search, page, limit, id }] = queryKey

    const { data } = await api.get(
        `${import.meta.env.VITE_API_URL}/api/warehouseproduct/get`,
        {
            params: {
                warehouseId: id,
                search: search || '',
                page,
                limit,
            },
        }
    )

    const formattedData = data.flatMap((item) =>
        item.products.map((product) => ({
            id: `${item._id}-${product._id}`,

            warehouseId: item.warehouseId?._id,
            wareHouseName: item.warehouseId?.wareHouseName || 'Unknown',
            location: item.warehouseId?.location || 'Unknown',

            productId: product.productId?._id,
            productName: product.productId?.name || 'Unknown',
            quantityMT: product.quantityMT,

        }))
    )

    return {
        data: formattedData,
        total: data.totalItems,
        totalPages: data.totalPages,
        page: data.page,
    }
}


// ------------------------------------------------------------------------------------------

// this is Product list section 

// warehouse name list
// get api for warehouse name droplist

export const getWarehouseListApi = async ({ search, page, limit }) => {

    const { data } = await api.get(
        `${import.meta.env.VITE_API_URL}/api/warehouse/dropdown/list`,
        {
            params: {
                search: search || "",
                page,
                limit,
            },
        }
    );

    return {
        data: data.map((item) => ({
            _id: item._id,
            id: item._id,
            wareHouseName: item.wareHouseName || "Unknown",
        })),
        total: data.total,
        totalPages: data.totalPages,
        page: data.page,
        hasMore: data.page < data.totalPages,
    };
};



// Get Warehouse Product List (with search + pagination)
export const getProductListApi = async ({ queryKey }) => {
    const [_key, { search, page, limit }] = queryKey;


    const { data } = await api.get(
        `${import.meta.env.VITE_API_URL}/api/warehouse/product`,
        {
            params: {
                search: search || '',
                page,
                limit,
            },
        }
    );

    return {
        data: data.map((item) => ({
            _id: item._id,
            id: item._id,
            productName: item.name || 'Unknown',
            category: item.category || 'Unknown',
        })),
        total: data.total,
        totalPages: data.totalPages,
        page: data.page,
        hasMore: data.page < data.totalPages,
    };
};

// -----------------------------------------------------------------------------------------------------

// This is Inventory section 

export const getInventoryProductListApi = async ({ queryKey }) => {

    const [_key, { search, page, limit }] = queryKey;



    const { data } = await api.get(
        `${import.meta.env.VITE_API_URL}/api/warehouseproduct/get`,
        {
            params: {
                search: search || "",
                page,
                limit,
            },
        }
    );

    return {
        data: data.flatMap(item =>
            item.products.map(p => ({
                _id: item._id,
                wareHouseName: item.warehouseId?.wareHouseName || "Unknown",
                location: item.warehouseId?.location || "",
                capacityKg: item.warehouseId?.capacityKg || "",
                totalQuantityKg: item.totalQuantityKg || " ",
                // product section
                productId: p.productId?._id,
                productName: p.productId?.name,
                quantityKg: p.quantityKg,
                bagSizeKg: p.bagSizeKg,
                totalBags: p.totalBags,
            }))
        ),

        total: data.totalItems,
        totalPages: data.totalPages,
        page: data.page,
    };
};

// ------------------------------------------------------------------------------------------- 

// Godown LR tp pass

// get
export const getGodownTPApi = async ({ queryKey }) => {
    const [_key, { search, page, limit, consignorId, consigneeId }] = queryKey;

    const params = {
        search: search || "",
        page,
        limit,
    };

    if (consignorId) params.consignorId = consignorId;
    if (consigneeId) params.consigneeId = consigneeId;

    // ✅ api.get already returns response.data
    const data = await api.get(
        `${import.meta.env.VITE_API_URL}/api/godown-lorry-receipt/get`,
        params
    );

    console.log("All Lorry Receipts Data:", data);

    return {
        total: data.total,
        page: data.page,
        limit: data.limit,

        receipts: data.receipts.map((item) => ({
            id: item._id,
            date: formatDateToDDMMYYYY(item.date),
            originalDate: item.date,
            receiptNo: item.receiptNo,
            issuedBy: item.issuedBy,
            receivedBy: item.receivedBy,

            companyId: item.companyId?._id,
            companyName: item.companyId?.companyName,
            companyEmail: item.companyId?.email,
            companyAddress: item.companyId?.address,
            companymobileNumber: item.companyId?.mobileNumber,
            companyofficeNumber: item.companyId?.officeNumber,
            companygstNumber: item.companyId?.gstNumber,
            digitalSignatureId: item.companyId?.digitalSignatureId,

            consignorId: item.consignorId,
            consignorName: item.consignorName,
            consignorAddress: item.consignorAddress,
            consigneeId: item.consigneeId,
            consigneeName: item.consigneeName,
            consigneeAddress: item.consigneeAddress,

            customerName: item.customerName,
            customerAddress: item.customerAddress,
            startLocation: item.startLocation,
            endLocation: item.endLocation,

            vehicleId: item.vehicleId,
            vehicleName: item.vehicleName,

            driverId: item.driverId,
            driverName: item.driverName,
            supervisorId: item.supervisorId,

            acknowledgementImage: item.acknowledgementImage,

            products:
                item.products?.map((p) => ({
                    warehouseId: p.warehouseId,
                    warehouseName: p.warehouseName,
                    productId: p.productId,
                    productName: p.productName,
                    quantityMT: p.quantityMT || 0,
                    bagSize: p.bagSize || 0,
                    totalBags: p.totalBags || 0,
                    updatedQuantityMT: p.updatedQuantityMT || 0,
                    id: p._id,
                })) || [],

            customerRate: item.customerRate || 0,
            totalAmount: item.totalAmount || 0,
            transporterRate: item.transporterRate || 0,
            totalTransporterAmount: item.totalTransporterAmount || 0,
            transporterRateOn: item.transporterRateOn || 0,
            customerRateOn: item.customerRateOn || 0,
            customerFreight: item.customerFreight || 0,
            transporterFreight: item.transporterFreight || 0,
            status: item.status,
        })),
    };
};



// post Api TP
export const postGodownTPApi = async (create) => {
    try {
        const response = await api.post(
            `${import.meta.env.VITE_API_URL}/api/godown-lorry-receipt/create`,
            create,

        );

        return response.data;
    } catch (error) {
        // If server returns 500 internal error
        if (error.response?.status === 500) {
            throw new Error("Server Error (500): Please try again later.");
        }

        // Other API errors
        throw new Error(error.response?.data?.message || "Failed to create Inventory");
    }
};

// // Patch update status data
// export const patchGodownTPStatusApi = async (id, data) => {
//     try {
//         const response = await api.patch(
//             `${import.meta.env.VITE_API_URL}/api/godown-lorry-receipt/update-status/${id}`,
//             data,
//             {
//                 headers: { Authorization: `Bearer ${TOKEN}` },
//             }
//         );

//         return response.data;
//     } catch (error) {
//         throw new Error(error.response?.data?.message || 'Update failed');
//     }
// };

// // DELETE Warehouse
// export const deleteGodownTPApi = async (id) => {
//     try {
//         const response = await api.delete(
//             `${import.meta.env.VITE_API_URL}/api/godown-lorry-receipt/softdelete/${id}`,
//             {
//                 headers: { Authorization: `Bearer ${TOKEN}` },
//             }
//         );

//         return response.data;
//     } catch (error) {
//         throw new Error(error.response?.data?.message || 'Delete failed');
//     }
// };


// // acknowledgementImage

// export const patchAcknowledgementsApi = async (id, formData) => {
//     try {
//         const response = await api.patch(
//             `${import.meta.env.VITE_API_URL}/api/godown-lorry-receipt/update-status/${id}`,
//             formData,
//             {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                     Authorization: `Bearer ${TOKEN}`,
//                 },
//             }
//         )
//         return response.data
//     } catch (error) {
//         console.error("Error:", error.response?.data || error.message)
//         throw error
//     }
// }


// ------------------------------------------------------------------------------------------------------------------------------------ 


// Consignee api 
export const getConsigneeApi = async ({ queryKey }) => {
    const [_key, { search, page, limit }] = queryKey;

    const response = await api.get(
        `${import.meta.env.VITE_API_URL}/api/consignee/get`,
        {
            params: {
                search: search || '',
                page,
                limit
            },
        }
    );

    // Check the actual response structure
    console.log("Consignee API Response:", response);

    // Assuming response has data property with consignees array
    const consignees = response.data?.consignees || response.consignees || response.data || [];
    const totalCount = response.data?.count || response.count || consignees.length;

    return {
        data: consignees.map((item) => ({
            id: item._id || item.id,
            name: item.name || "Unknown",
            address: item.address || "Unknown",
        })),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        page: page
    };
};

// Consignor api
export const getConsignorApi = async ({ queryKey }) => {
    const [_key, { search, page, limit }] = queryKey;

    const response = await api.get(
        `${import.meta.env.VITE_API_URL}/api/consignor/get`,
        {
            params: {
                search: search || '',
                page,
                limit
            },
        }
    );

    // Check the actual response structure
    console.log("Consignor API Response:", response);

    // Assuming response has data property with consignors array
    const consignors = response.data?.consignors || response.consignors || response.data || [];
    const totalCount = response.data?.count || response.count || consignors.length;

    return {
        data: consignors.map((item) => ({
            id: item._id || item.id,
            name: item.name || "Unknown",
            address: item.address || "Unknown",
        })),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        page: page
    };
};



// -------------------------------------------------------------------------------------------------------------- 

// Railhead inventory 

// Railhead Get Api 

export const getRailHeadApi = async ({ queryKey }) => {
    const [_key, { search, page, limit }] = queryKey


    const response = await api.get(
        `${import.meta.env.VITE_API_URL}/api/railhead/get`,
        {
            params: {
                search: search || '',
                page,
                limit,
            },
        }
    )

    // Check if response.data exists and has the expected structure
    if (!response.data) {
        throw new Error('No data received from API')
    }

    const apiData = response.data

    // Transform the data items
    const transformedData = Array.isArray(apiData)
        ? apiData.map((item) => ({
            id: item._id,
            createdAt: formatDateToDDMMYYYY(item.createdAt) || "--",
            productId: item.productId || "",
            productName: item.productName || 'Unknown',
            quantityMT: item.quantityMT || 0,

        }))
        : []

    return {
        data: transformedData,
        total: apiData.totalItems || apiData.total || 0,
        totalPages: apiData.totalPages || 1,
        page: apiData.page || 1,
    }
}

