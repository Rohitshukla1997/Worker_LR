import { api } from "../../../lib/services/api_services";
import { formatDateToDDMMYYYY } from '../../../customhooks/useFormattedDate'


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

// Get api
export const getGodownTPApi = async ({ queryKey }) => {
    const [_key, { search, page, limit }] = queryKey;

    const { receipts } = await api.get(
        `${import.meta.env.VITE_API_URL}/api/godown-lorry-receipt/get`,
        {
            params: {
                search: search || "",
                page,
                limit,
            },
        }
    );

    console.log("All Lorry Receipts Data: ", receipts);

    // Map the receipts data to include all necessary fields
    const mappedData = receipts.map((item) => ({
        id: item._id,
        _id: item._id,
        date: formatDateToDDMMYYYY(item.date),
        originalDate: item.date,
        ownerName: item.ownerName,
        consignorName: item.consignorName,
        consignorAddress: item.consignorAddress,
        consigneeName: item.consigneeName,
        consigneeAddress: item.consigneeAddress,
        customerName: item.customerName,
        customerAddress: item.customerAddress,
        startLocation: item.startLocation,
        endLocation: item.endLocation,
        vehicleId: item.vehicleId,
        vehicleName: item.vehicleName,
        workerId: item.workerId?._id || null,
        workerName: item.workerId?.name || "",
        driverId: item.driverId,
        driverName: item.driverName,
        supervisorId: item.supervisorId,
        products: item.products?.map((p) => ({
            warehouseId: p.warehouseId,
            warehouseName: p.warehouseName,
            productId: p.productId,
            productName: p.productName,
            quantityMT: p.quantityMT,
            bags: p.bags,
            itemUnit: p.itemUnit,
            itemWeight: p.itemWeight,
            itemCost: p.itemCost,
            id: p._id,
            _id: p._id,
        })) || [],
        customerRate: item.customerRate,
        totalAmount: item.totalAmount,
        transporterRate: item.transporterRate,
        totalTransporterAmount: item.totalTransporterAmount,
        transporterRateOn: item.transporterRateOn,
        customerRateOn: item.customerRateOn,
        customerFreight: item.customerFreight,
        transporterFreight: item.transporterFreight,
        status: item.status,
    }));

    // Return the structure that both TableArray and pagination expect
    return {
        total: receipts.total,
        totalPages: Math.ceil(receipts.total / limit),
        page: receipts.page,
        limit: receipts.limit,
        data: mappedData, // This is what TableArray will use directly
        allData: mappedData, // Keep this for filteredData if needed
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

