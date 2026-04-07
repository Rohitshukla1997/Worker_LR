import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  DriverApi,
  getCompanyNameApi,
  VehicleApi,
} from "../../../TransportPass/data/data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  FaWarehouse,
  FaUserFriends,
  FaCalculator,
  FaBox,
  FaWeight,
  FaInfoCircle,
  FaRupeeSign,
  FaUserPlus,
  FaTimes,
  FaTrash,
  FaPlus,
  FaCheckCircle,
} from "react-icons/fa";
import {
  getConsigneeApi,
  getConsignorApi,
  getWarehouseListApi,
  getWarehouseProfileApi,
  getRailHeadApi,
  getMartialOwnerDropDownApi,
} from "../../data/data";
import { toast } from "react-toastify";

const defaultProduct = {
  warehouseId: "",
  warehouseName: "",
  productId: "",
  productName: "",
  quantityMT: "",
  bagSize: "",
  totalBags: "",
};

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultFormData = {
  tpPassType: "warehouse",
  issuedBy: "Railhead",
  receivedBy: "Warehouse/Party",
  receivedByType: "",
  receivedByWarehouseId: "",
  receivedByWarehouseName: "",
  supervisorId: "",
  companyId: "",
  companyName: "",
  companyEmail: "",
  companyMobileNumber: "",
  companyOfficeNumber: "",
  companyAddress: "",
  gstIn: "",
  date: getTodayDate(),
  vehicleId: "",
  vehicleName: "",
  driverId: "",
  driverName: "",
  consignorId: "",
  consignorName: "",
  consignorAddress: "",
  consigneeId: "",
  consigneeName: "",
  consigneeAddress: "",
  materialOwnerId: "",
  materialOwnerName: "",
  materialOwnerAddress: "",
  startLocation: "",
  endLocation: "",
  customerRate: "",
  totalAmount: "",
  transporterRate: "",
  totalTransporterAmount: "",
  transporterRateOn: "",
  customerRateOn: "",
  customerFreight: "",
  transporterFreight: "",
  products: [{ ...defaultProduct }],
};

// Calculate quantity in MT from bag size and total bags
const calculateQuantityFromBags = (bagSize, totalBags) => {
  if (!bagSize || !totalBags || bagSize <= 0 || totalBags <= 0) return "";
  const quantityInMT = (bagSize * totalBags) / 1000;
  return quantityInMT.toFixed(3);
};

// Calculate total bags from bag size and quantity in MT
const calculateBagsFromQuantity = (bagSize, quantityMT) => {
  if (!bagSize || !quantityMT || bagSize <= 0 || quantityMT <= 0) return "";
  const totalBags = (quantityMT * 1000) / bagSize;
  return Math.round(totalBags);
};

// Calculate bag size from total bags and quantity in MT
const calculateBagSizeFromQuantityAndBags = (quantityMT, totalBags) => {
  if (!quantityMT || !totalBags || quantityMT <= 0 || totalBags <= 0) return "";
  const bagSize = (quantityMT * 1000) / totalBags;
  return bagSize.toFixed(2);
};

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const WarehouseForm = ({
  show,
  handleClose,
  handleSubmit,
  initialData = {},
  mode = "add",
  isLoading = false,
  onFormTypeChange,
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [showConsignorModal, setShowConsignorModal] = useState(false);
  const [showConsigneeModal, setShowConsigneeModal] = useState(false);
  const [calculationSource, setCalculationSource] = useState({});

  const [receivedByOptions] = useState([
    {
      value: "warehouse",
      label: "Warehouse",
      icon: <FaWarehouse className="mr-2" />,
    },
    {
      value: "party",
      label: "Party",
      icon: <FaUserFriends className="mr-2" />,
    },
  ]);

  // Search and pagination states
  const [consignorSearchInput, setConsignorSearchInput] = useState("");
  const [consigneeSearchInput, setConsigneeSearchInput] = useState("");
  const [materialOwnerSearchInput, setMaterialOwnerSearchInput] = useState("");

  const debouncedConsignorSearch = useDebounce(consignorSearchInput, 300);
  const debouncedConsigneeSearch = useDebounce(consigneeSearchInput, 300);
  const debouncedMaterialOwnerSearch = useDebounce(
    materialOwnerSearchInput,
    300,
  );

  const [consignorPage, setConsignorPage] = useState(1);
  const [consigneePage, setConsigneePage] = useState(1);
  const [materialOwnerPage, setMaterialOwnerPage] = useState(1);
  const itemsPerPage = 20;

  const queryClient = useQueryClient();

  // Calculate total quantity in MT across all products
  const calculateTotalQuantityMT = useCallback(() => {
    return formData.products.reduce((total, product) => {
      const quantity = parseFloat(product.quantityMT) || 0;
      return total + quantity;
    }, 0);
  }, [formData.products]);

  // Auto-calculate total amount when customer rate or total quantity changes
  useEffect(() => {
    const totalQuantity = calculateTotalQuantityMT();
    const customerRate = parseFloat(formData.customerRate) || 0;
    const calculatedTotalAmount = totalQuantity * customerRate;

    setFormData((prev) => ({
      ...prev,
      totalAmount: calculatedTotalAmount.toFixed(2),
    }));
  }, [formData.customerRate, formData.products, calculateTotalQuantityMT]);

  // Auto-calculate total transporter amount when transporter rate or total quantity changes
  useEffect(() => {
    const totalQuantity = calculateTotalQuantityMT();
    const transporterRate = parseFloat(formData.transporterRate) || 0;
    const calculatedTotalTransporterAmount = totalQuantity * transporterRate;

    setFormData((prev) => ({
      ...prev,
      totalTransporterAmount: calculatedTotalTransporterAmount.toFixed(2),
    }));
  }, [formData.transporterRate, formData.products, calculateTotalQuantityMT]);

  const { data: companyList = [] } = useQuery({
    queryKey: ["companyList"],
    queryFn: getCompanyNameApi,
  });

  const { data: warehouseResponse = {} } = useQuery({
    queryKey: ["getWarehouseList", { page: 1, limit: 100 }],
    queryFn: ({ queryKey }) => getWarehouseListApi(queryKey[1]),
  });

  const { data: railHeadData = {}, isFetching: isRailHeadFetching } = useQuery({
    queryKey: ["RailHead", { search: "", page: 1, limit: 100 }],
    queryFn: getRailHeadApi,
  });

  // Fetch Consignor data
  const {
    data: consignorData = { data: [], total: 0 },
    isFetching: isFetchingConsignor,
  } = useQuery({
    queryKey: [
      "Consignor",
      {
        search: debouncedConsignorSearch,
        page: consignorPage,
        limit: itemsPerPage,
      },
    ],
    queryFn: getConsignorApi,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Consignee data
  const {
    data: consigneeData = { data: [], total: 0 },
    isFetching: isFetchingConsignee,
  } = useQuery({
    queryKey: [
      "Consignee",
      {
        search: debouncedConsigneeSearch,
        page: consigneePage,
        limit: itemsPerPage,
      },
    ],
    queryFn: getConsigneeApi,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Material Owner data
  const {
    data: materialOwnerData = { data: [], total: 0 },
    isFetching: isFetchingMaterialOwner,
  } = useQuery({
    queryKey: [
      "MartialOwner",
      {
        search: debouncedMaterialOwnerSearch,
        page: materialOwnerPage,
        limit: itemsPerPage,
      },
    ],
    queryFn: getMartialOwnerDropDownApi,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  });

  const warehouseList = warehouseResponse?.data || [];
  const inventoryList = railHeadData?.data || [];
  const consignorList = consignorData?.data || [];
  const consigneeList = consigneeData?.data || [];
  const materialOwnerList = materialOwnerData?.data || [];

  const handleNumberInputScroll = (e) => {
    e.preventDefault();
    e.target.blur();
    return false;
  };

  // Helper function to show calculation hint
  const getCalculationHint = (index, field) => {
    const source = calculationSource[index];
    if (!source) return null;

    const product = formData.products[index];
    const bagSize = parseFloat(product.bagSize);
    const totalBags = parseInt(product.totalBags);
    const quantityMT = parseFloat(product.quantityMT);

    if (field === "bagSize" && source !== "bagSize" && bagSize > 0) {
      return `Auto-calculated from ${quantityMT > 0 ? `${quantityMT} MT and ${totalBags} bags` : `${totalBags} bags and ${quantityMT} MT`}`;
    }
    if (field === "totalBags" && source !== "totalBags" && totalBags > 0) {
      return `Auto-calculated from ${bagSize > 0 ? `${bagSize} kg bags and ${quantityMT} MT` : `${bagSize} kg bags and ${quantityMT} MT`}`;
    }
    if (field === "quantityMT" && source !== "quantityMT" && quantityMT > 0) {
      return `Auto-calculated from ${bagSize > 0 ? `${bagSize} kg bags and ${totalBags} bags` : `${totalBags} bags and ${bagSize} kg bags`}`;
    }
    return null;
  };

  // Vehicle and Driver handlers
  const handleVehicleChange = (selected, action) => {
    if (selected) {
      if (action.action === "create-option") {
        setFormData((prev) => ({
          ...prev,
          vehicleId: selected.value,
          vehicleName: selected.label,
        }));
      } else {
        const selectedVehicle = vehicles.find(
          (v) => v.id === selected.value || v._id === selected.value,
        );
        setFormData((prev) => ({
          ...prev,
          vehicleId: selected.value,
          vehicleName:
            selectedVehicle?.name ||
            selectedVehicle?.vehicleNumber ||
            selected.label,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, vehicleId: "", vehicleName: "" }));
    }
  };

  const handleDriverChange = (selected, action) => {
    if (selected) {
      if (action.action === "create-option") {
        setFormData((prev) => ({
          ...prev,
          driverId: selected.value,
          driverName: selected.label,
        }));
      } else {
        const selectedDriver = drivers.find((d) => d.id === selected.value);
        setFormData((prev) => ({
          ...prev,
          driverId: selected.value,
          driverName: selectedDriver?.name || selected.label,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, driverId: "", driverName: "" }));
    }
  };

  const handleConsignorChange = (selected) => {
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        consignorId: selected.value,
        consignorName: selected.name,
        consignorAddress: selected.address,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        consignorId: "",
        consignorName: "",
        consignorAddress: "",
      }));
    }
  };

  const handleConsigneeChange = (selected) => {
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        consigneeId: selected.value,
        consigneeName: selected.name,
        consigneeAddress: selected.address,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        consigneeId: "",
        consigneeName: "",
        consigneeAddress: "",
      }));
    }
  };

  const handleMaterialOwnerChange = (selected) => {
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        materialOwnerId: selected.value,
        materialOwnerName: selected.name,
        materialOwnerAddress: selected.address || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        materialOwnerId: "",
        materialOwnerName: "",
        materialOwnerAddress: "",
      }));
    }
  };

  const handleConsignorInputChange = useCallback((value) => {
    setConsignorSearchInput(value);
    setConsignorPage(1);
  }, []);

  const handleConsigneeInputChange = useCallback((value) => {
    setConsigneeSearchInput(value);
    setConsigneePage(1);
  }, []);

  const handleMaterialOwnerInputChange = useCallback((value) => {
    setMaterialOwnerSearchInput(value);
    setMaterialOwnerPage(1);
  }, []);

  const handleConsignorMenuScrollToBottom = useCallback(() => {
    const totalPages = Math.ceil(consignorData.total / itemsPerPage);
    if (consignorPage < totalPages) {
      setConsignorPage((prev) => prev + 1);
    }
  }, [consignorData.total, consignorPage]);

  const handleConsigneeMenuScrollToBottom = useCallback(() => {
    const totalPages = Math.ceil(consigneeData.total / itemsPerPage);
    if (consigneePage < totalPages) {
      setConsigneePage((prev) => prev + 1);
    }
  }, [consigneeData.total, consigneePage]);

  const handleMaterialOwnerMenuScrollToBottom = useCallback(() => {
    const totalPages = Math.ceil(
      (materialOwnerData?.total || 0) / itemsPerPage,
    );
    if (materialOwnerPage < totalPages) {
      setMaterialOwnerPage((prev) => prev + 1);
    }
  }, [materialOwnerData?.total, materialOwnerPage]);

  // Extract product details
  useEffect(() => {
    if (inventoryList.length > 0) {
      console.log("=== RAIL HEAD DATA ===", inventoryList);

      const details = {};
      inventoryList.forEach((item) => {
        const productId = item._id || item.id || item.productId;

        if (productId) {
          details[productId] = {
            _id: item._id,
            id: item.id,
            productId: item.productId || item._id,
            productName: item.productName || item.name || "Unknown Product",
            quantityMT:
              item.quantityMT || item.quantity || item.totalQuantity || 0,
            bagSize: item.bagSize || item.bagWeight || 0,
            totalBags: item.totalBags || item.bags || item.totalBagsCount || 0,
            __v: item.__v,
          };
        }
      });

      setProductDetails(details);
    }
  }, [inventoryList]);

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const data = await DriverApi();
        setDrivers(data || []);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    const loadVehicles = async () => {
      try {
        const data = await VehicleApi();
        setVehicles(data || []);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    loadDrivers();
    loadVehicles();
  }, []);

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      console.log("WarehouseForm initialData:", initialData);

      const parseDate = (dateString) => {
        if (!dateString) return getTodayDate();

        try {
          if (dateString.includes("/")) {
            const parts = dateString.split("/");
            if (parts.length === 3) {
              const day = parts[0].padStart(2, "0");
              const month = parts[1].padStart(2, "0");
              const year = parts[2];
              return `${year}-${month}-${day}`;
            }
          }

          if (dateString.includes("T")) {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              return `${year}-${month}-${day}`;
            }
          }

          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }

        return getTodayDate();
      };

      let receivedByType = "warehouse";
      if (initialData.receivedBy === "Party") {
        receivedByType = "party";
      }

      const editedFormData = {
        ...defaultFormData,
        ...initialData,
        date: parseDate(initialData.date),
        vehicleName:
          vehicles.find((vehicle) => vehicle.id === initialData.vehicleId)
            ?.name || "",
        driverName:
          drivers.find((driver) => driver.id === initialData.driverId)?.name ||
          "",
        companyId: initialData.companyId || "",
        consignorId: initialData.consignorId || "",
        consignorName: initialData.consignorName || "",
        consignorAddress: initialData.consignorAddress || "",
        consigneeId: initialData.consigneeId || "",
        consigneeName: initialData.consigneeName || "",
        consigneeAddress: initialData.consigneeAddress || "",
        materialOwnerId: initialData.materialOwnerId || "",
        materialOwnerName: initialData.materialOwnerName || "",
        materialOwnerAddress: initialData.materialOwnerAddress || "",
        receivedByType: receivedByType,
        products: initialData.products?.map((product) => ({
          ...defaultProduct,
          ...product,
          quantityMT: product.quantityMT?.toString() || "",
          bagSize: product.bagSize?.toString() || "",
          totalBags: product.totalBags?.toString() || "",
          ...(initialData.receivedBy === "Party"
            ? {
                warehouseId: "",
                warehouseName: "",
              }
            : {}),
        })) || [{ ...defaultProduct }],
      };

      console.log("WarehouseForm editedFormData - Date:", editedFormData.date);
      console.log("WarehouseForm editedFormData:", editedFormData);
      setFormData(editedFormData);
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData, mode, vehicles, drivers]);

  // Auto-fill warehouse in products
  useEffect(() => {
    if (
      formData.receivedByType === "warehouse" &&
      formData.receivedByWarehouseId &&
      formData.issuedBy === "Railhead"
    ) {
      const updatedProducts = formData.products.map((product) => ({
        ...product,
        warehouseId: formData.receivedByWarehouseId,
        warehouseName: formData.receivedByWarehouseName,
      }));

      if (
        JSON.stringify(updatedProducts) !== JSON.stringify(formData.products)
      ) {
        setFormData((prev) => ({
          ...prev,
          products: updatedProducts,
        }));
      }
    }

    if (
      formData.receivedByType === "party" &&
      formData.issuedBy === "Railhead"
    ) {
      const hasWarehouseInProducts = formData.products.some(
        (product) => product.warehouseId || product.warehouseName,
      );
      if (hasWarehouseInProducts) {
        const updatedProducts = formData.products.map((product) => ({
          ...product,
          warehouseId: "",
          warehouseName: "",
        }));

        setFormData((prev) => ({
          ...prev,
          products: updatedProducts,
        }));
      }
    }
  }, [
    formData.receivedByType,
    formData.receivedByWarehouseId,
    formData.receivedByWarehouseName,
    formData.issuedBy,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReceivedByTypeChange = (type) => {
    if (type === "warehouse") {
      setFormData((prev) => ({
        ...prev,
        receivedByType: "warehouse",
        receivedBy: "Warehouse",
        receivedByWarehouseId: "",
        receivedByWarehouseName: "",
        products: prev.products.map((product) => ({
          ...product,
          warehouseId: "",
          warehouseName: "",
        })),
      }));
    } else if (type === "party") {
      setFormData((prev) => ({
        ...prev,
        receivedByType: "party",
        receivedBy: "Party",
        receivedByWarehouseId: "",
        receivedByWarehouseName: "",
        products: prev.products.map((product) => ({
          ...product,
          warehouseId: "",
          warehouseName: "",
        })),
      }));
    }
  };

  const handleWarehouseSelect = (selected) => {
    if (selected) {
      const selectedWarehouse = warehouseList.find(
        (w) => w.id === selected.value || w._id === selected.value,
      );
      setFormData((prev) => ({
        ...prev,
        receivedByWarehouseId: selected.value,
        receivedByWarehouseName:
          selectedWarehouse?.wareHouseName ||
          selectedWarehouse?.name ||
          selected.label,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        receivedByWarehouseId: "",
        receivedByWarehouseName: "",
      }));
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];

    if (field === "warehouseId") {
      const selectedWarehouse = warehouseList.find(
        (w) => w.id === value || w._id === value,
      );
      updatedProducts[index] = {
        ...updatedProducts[index],
        warehouseId: value,
        warehouseName:
          selectedWarehouse?.wareHouseName || selectedWarehouse?.name || "",
      };
    } else if (field === "productId") {
      const selectedProduct = inventoryList.find(
        (p) => p._id === value || p.id === value,
      );

      if (selectedProduct) {
        const productName =
          selectedProduct.productName ||
          selectedProduct.name ||
          "Unknown Product";
        const productId = selectedProduct.productId;
        const inventoryId = selectedProduct._id || selectedProduct.id;

        const bagSize =
          selectedProduct.bagSize || selectedProduct.bagWeight || 0;
        const totalBags =
          selectedProduct.totalBags || selectedProduct.totalags || 0;
        const quantityMT =
          selectedProduct.quantityMT || selectedProduct.quantity || 0;

        updatedProducts[index] = {
          ...updatedProducts[index],
          inventoryId: inventoryId,
          productId: productId,
          productName: productName,
          quantityMT: quantityMT.toString(),
          bagSize: bagSize.toString(),
          totalBags: totalBags.toString(),
        };
      } else {
        updatedProducts[index] = {
          ...updatedProducts[index],
          inventoryId: "",
          productId: value,
          productName: "",
          quantityMT: "",
          bagSize: "",
          totalBags: "",
        };
      }
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value,
      };
    }

    const currentProduct = updatedProducts[index];
    const bagSize = parseFloat(currentProduct.bagSize);
    const totalBags = parseInt(currentProduct.totalBags);
    const quantityMT = parseFloat(currentProduct.quantityMT);

    // Track which field triggered the calculation
    if (
      field === "bagSize" ||
      field === "totalBags" ||
      field === "quantityMT"
    ) {
      setCalculationSource((prev) => ({ ...prev, [index]: field }));
    }

    // Perform calculations based on which field was changed
    if (field === "bagSize" && value && !isNaN(bagSize) && bagSize > 0) {
      if (totalBags && !isNaN(totalBags) && totalBags > 0) {
        const calculatedQuantity = calculateQuantityFromBags(
          bagSize,
          totalBags,
        );
        if (calculatedQuantity) {
          updatedProducts[index].quantityMT = calculatedQuantity;
        }
      } else if (quantityMT && !isNaN(quantityMT) && quantityMT > 0) {
        const calculatedBags = calculateBagsFromQuantity(bagSize, quantityMT);
        if (calculatedBags) {
          updatedProducts[index].totalBags = calculatedBags;
        }
      }
    } else if (
      field === "totalBags" &&
      value &&
      !isNaN(totalBags) &&
      totalBags > 0
    ) {
      if (bagSize && !isNaN(bagSize) && bagSize > 0) {
        const calculatedQuantity = calculateQuantityFromBags(
          bagSize,
          totalBags,
        );
        if (calculatedQuantity) {
          updatedProducts[index].quantityMT = calculatedQuantity;
        }
      } else if (quantityMT && !isNaN(quantityMT) && quantityMT > 0) {
        const calculatedBagSize = calculateBagSizeFromQuantityAndBags(
          quantityMT,
          totalBags,
        );
        if (calculatedBagSize) {
          updatedProducts[index].bagSize = calculatedBagSize;
        }
      }
    } else if (
      field === "quantityMT" &&
      value &&
      !isNaN(quantityMT) &&
      quantityMT > 0
    ) {
      if (bagSize && !isNaN(bagSize) && bagSize > 0) {
        const calculatedBags = calculateBagsFromQuantity(bagSize, quantityMT);
        if (calculatedBags) {
          updatedProducts[index].totalBags = calculatedBags;
        }
      } else if (totalBags && !isNaN(totalBags) && totalBags > 0) {
        const calculatedBagSize = calculateBagSizeFromQuantityAndBags(
          quantityMT,
          totalBags,
        );
        if (calculatedBagSize) {
          updatedProducts[index].bagSize = calculatedBagSize;
        }
      }
    }

    if (
      field !== "warehouseId" &&
      formData.receivedByType === "warehouse" &&
      formData.receivedByWarehouseId &&
      formData.issuedBy === "Railhead"
    ) {
      updatedProducts[index] = {
        ...updatedProducts[index],
        warehouseId: formData.receivedByWarehouseId,
        warehouseName: formData.receivedByWarehouseName,
      };
    }

    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  const addProduct = () => {
    const newProduct = {
      ...defaultProduct,
    };

    if (
      formData.receivedByType === "warehouse" &&
      formData.receivedByWarehouseId &&
      formData.issuedBy === "Railhead"
    ) {
      newProduct.warehouseId = formData.receivedByWarehouseId;
      newProduct.warehouseName = formData.receivedByWarehouseName;
    }

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = [...formData.products];
      updatedProducts.splice(index, 1);
      setFormData((prev) => ({ ...prev, products: updatedProducts }));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    console.log("=== PRODUCTS BEFORE VALIDATION ===");
    formData.products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        productId: product.productId,
        productName: product.productName,
        quantityMT: product.quantityMT,
        bagSize: product.bagSize,
        totalBags: product.totalBags,
      });
    });

    if (!formData.companyId) {
      toast.error("Please select a company");
      return;
    }

    if (!formData.startLocation || !formData.endLocation) {
      toast.error("Please enter both start and end locations");
      return;
    }

    const invalidProducts = formData.products.reduce((acc, product, index) => {
      let isValid = true;
      const errorMessages = [];

      if (!product.productId) {
        errorMessages.push("Missing product selection");
        isValid = false;
      }

      const quantityMT = parseFloat(product.quantityMT);
      if (isNaN(quantityMT) || quantityMT <= 0) {
        errorMessages.push("Invalid quantity (must be greater than 0)");
        isValid = false;
      }

      if (warehouseDisplayMode !== "hidden" && !product.warehouseId) {
        errorMessages.push("Warehouse selection required");
        isValid = false;
      }

      if (!isValid) {
        console.log(`Product ${index + 1} validation failed:`, errorMessages);
        acc.push({ index, errors: errorMessages });
      }

      return acc;
    }, []);

    if (invalidProducts.length > 0) {
      const firstError = invalidProducts[0];
      const productNumber = firstError.index + 1;
      const errorDetails = firstError.errors.join(", ");
      toast.error(
        `Product ${productNumber} has validation errors: ${errorDetails}`,
      );
      return;
    }

    const vehicleExistsInDb = vehicleOptions.some(
      (vehicle) => vehicle.value === formData.vehicleId,
    );

    const driverExistsInDb = driverOptions.some(
      (driver) => driver.value === formData.driverId,
    );

    const processNumberField = (value) => {
      if (value === "" || value === null || value === undefined) {
        return 0;
      }
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    const preparedProducts = formData.products.map((product) => {
      const productFromInventory = inventoryList.find(
        (p) => p._id === product.productId || p.id === product.productId,
      );

      const actualProductId =
        productFromInventory?.productId || product.productId;
      const actualProductName =
        productFromInventory?.productName ||
        productFromInventory?.name ||
        product.productName;

      const baseProduct = {
        ...product,
        productId: actualProductId,
        productName: actualProductName,
        quantityMT: parseFloat(product.quantityMT) || 0,
        bagSize: parseFloat(product.bagSize) || 0,
        totalBags: parseFloat(product.totalBags) || 0,
      };

      if (
        formData.issuedBy === "Railhead" &&
        formData.receivedByType === "party"
      ) {
        const { warehouseId, warehouseName, ...rest } = baseProduct;
        return rest;
      }

      return baseProduct;
    });

    const totalQuantity = calculateTotalQuantityMT();
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    const totalTransporterAmount =
      parseFloat(formData.totalTransporterAmount) || 0;

    const payload = {
      ...formData,
      tpPassType: "warehouse",
      companyId: formData.companyId || "",
      materialOwnerId: formData.materialOwnerId || "",
      materialOwnerName: formData.materialOwnerName || "",
      materialOwnerAddress: formData.materialOwnerAddress || "",
      date: formData.date
        ? new Date(formData.date).toISOString()
        : new Date().toISOString(),
      products: preparedProducts,
      customerRate: processNumberField(formData.customerRate),
      totalAmount: totalAmount,
      transporterRate: processNumberField(formData.transporterRate),
      totalTransporterAmount: totalTransporterAmount,
      transporterRateOn: processNumberField(formData.transporterRateOn),
      customerRateOn: processNumberField(formData.customerRateOn),
      customerFreight: processNumberField(formData.customerFreight),
      transporterFreight: processNumberField(formData.transporterFreight),
    };

    if (!vehicleExistsInDb && payload.vehicleId) {
      console.log("Vehicle not found in DB, removing vehicleId from payload");
      payload.vehicleName = payload.vehicleId;
      delete payload.vehicleId;
    }

    if (!driverExistsInDb && payload.driverId) {
      console.log("Driver not found in DB, removing driverId from payload");
      payload.driverName = payload.driverId;
      delete payload.driverId;
    }

    if (
      formData.issuedBy === "Railhead" &&
      formData.receivedByType === "party"
    ) {
      payload.products = payload.products.map((product) => {
        const { warehouseId, warehouseName, ...rest } = product;
        return rest;
      });
    }

    if (
      formData.issuedBy === "Railhead" &&
      formData.receivedByType === "warehouse"
    ) {
      payload.products = payload.products.map((product) => ({
        ...product,
        warehouseId: product.warehouseId || formData.receivedByWarehouseId,
      }));
    }

    console.log("=== FINAL PAYLOAD ===", payload);
    console.log("=== VEHICLE EXISTS IN DB? ===", vehicleExistsInDb);
    console.log("=== DRIVER EXISTS IN DB? ===", driverExistsInDb);
    console.log("=== TOTAL QUANTITY MT ===", totalQuantity);
    console.log("=== PRODUCTS DETAIL ===", payload.products);

    handleSubmit(payload);
  };

  const formatNumberValue = (value) => {
    if (value === "" || value === null || value === undefined) {
      return "";
    }
    return value.toString();
  };

  const receivedByWarehouseOptions = warehouseList.map((w) => ({
    value: w.id || w._id,
    label: w.wareHouseName || w.name || "Unnamed Warehouse",
  }));

  const warehouseOptions = warehouseList.map((w) => ({
    value: w.id || w._id,
    label: w.wareHouseName || w.name || "Unnamed Warehouse",
  }));

  const productOptions = inventoryList.map((p) => {
    const inventoryId = p._id || p.id;
    const productId = p.productId || inventoryId;
    const productName = p.productName || p.name || "Unnamed Product";
    const quantityMT = p.quantityMT || p.quantity || 0;
    const bagSize = p.bagSize || p.bagWeight || 0;
    const totalBags = p.totalBags || p.bags || 0;

    return {
      value: inventoryId,
      label: `${productName} ( Available: ${quantityMT} MT, Bag Size: ${bagSize} kg, Total Bags: ${totalBags} )`,
      data: p,
    };
  });

  const companyOptions = companyList.map((c) => ({
    value: c.id || c._id,
    label: c.companyName || c.name || "Unnamed Company",
  }));

  const vehicleOptions = Array.isArray(vehicles)
    ? vehicles.map((v) => ({
        value: v.id || v._id,
        label: v.name || v.vehicleNumber || "Unnamed Vehicle",
      }))
    : [];

  const driverOptions = Array.isArray(drivers)
    ? drivers.map((d) => ({
        value: d.id || d._id,
        label: d.name || "Unnamed Driver",
      }))
    : [];

  const consignorOptions = consignorList.map((consignor) => ({
    value: consignor.id,
    label: consignor.name,
    name: consignor.name,
    address: consignor.address,
  }));

  const consigneeOptions = consigneeList.map((consignee) => ({
    value: consignee.id,
    label: consignee.name,
    name: consignee.name,
    address: consignee.address,
  }));

  const materialOwnerOptions = materialOwnerList.map((owner) => ({
    value: owner.id,
    label: owner.name,
    name: owner.name,
    address: owner.address || "",
  }));

  const getWarehouseValue = (product) => {
    if (!product.warehouseId) return null;
    return (
      warehouseOptions.find((opt) => opt.value === product.warehouseId) || null
    );
  };

  const getProductValue = (product) => {
    if (product.inventoryId) {
      const found = productOptions.find(
        (opt) => opt.value === product.inventoryId,
      );
      if (found) return found;
    }

    if (product.productId) {
      const found = productOptions.find((opt) => {
        const productData = opt.data || {};
        return (
          productData.productId === product.productId ||
          productData.id === product.productId ||
          productData._id === product.productId
        );
      });
      if (found) return found;
    }

    if (product.productName) {
      const found = productOptions.find((opt) => {
        const productData = opt.data || {};
        return (
          productData.productName === product.productName ||
          productData.name === product.productName
        );
      });
      if (found) return found;
    }

    return null;
  };

  const getCompanyValue = () => {
    if (!formData.companyId) return null;
    return (
      companyOptions.find((opt) => opt.value === formData.companyId) || null
    );
  };

  const getVehicleValue = () => {
    if (formData.vehicleId) {
      const existingVehicle = vehicleOptions.find(
        (opt) => opt.value === formData.vehicleId,
      );
      if (existingVehicle) {
        return existingVehicle;
      }
      return {
        value: formData.vehicleId,
        label: formData.vehicleName || formData.vehicleId,
      };
    }
    return null;
  };

  const getDriverValue = () => {
    if (formData.driverId) {
      const existingDriver = driverOptions.find(
        (opt) => opt.value === formData.driverId,
      );
      if (existingDriver) {
        return existingDriver;
      }
      return {
        value: formData.driverId,
        label: formData.driverName || formData.driverId,
      };
    }
    return null;
  };

  const getReceivedByWarehouseValue = () => {
    if (!formData.receivedByWarehouseId) return null;
    return (
      receivedByWarehouseOptions.find(
        (opt) => opt.value === formData.receivedByWarehouseId,
      ) || null
    );
  };

  const getConsignorValue = () => {
    if (!formData.consignorId) return null;
    return (
      consignorOptions.find((opt) => opt.value === formData.consignorId) || null
    );
  };

  const getConsigneeValue = () => {
    if (!formData.consigneeId) return null;
    return (
      consigneeOptions.find((opt) => opt.value === formData.consigneeId) || null
    );
  };

  const getMaterialOwnerValue = () => {
    if (!formData.materialOwnerId) return null;
    return (
      materialOwnerOptions.find(
        (opt) => opt.value === formData.materialOwnerId,
      ) || null
    );
  };

  const shouldShowWarehouseInProducts = () => {
    if (formData.issuedBy === "Railhead") {
      if (
        formData.receivedByType === "warehouse" ||
        formData.receivedBy === "Warehouse"
      ) {
        return "auto-filled";
      } else if (
        formData.receivedByType === "party" ||
        formData.receivedBy === "Party"
      ) {
        return "hidden";
      }
    }
    return "editable";
  };

  const warehouseDisplayMode = shouldShowWarehouseInProducts();
  const totalQuantity = calculateTotalQuantityMT();

  const getProductDetailForDisplay = (product) => {
    let productDetail;
    if (product.inventoryId) {
      productDetail = productDetails[product.inventoryId];
    }

    if (!productDetail && (product.productId || product.inventoryId)) {
      const productFromList = inventoryList.find(
        (p) =>
          p._id === product.inventoryId ||
          p.id === product.inventoryId ||
          p.productId === product.productId,
      );
      if (productFromList) {
        productDetail = {
          productId: productFromList.productId,
          inventoryId: productFromList._id || productFromList.id,
          productName:
            productFromList.productName ||
            productFromList.name ||
            "Unknown Product",
          quantityMT:
            productFromList.quantityMT || productFromList.quantity || 0,
          bagSize: productFromList.bagSize || productFromList.bagWeight || 0,
          totalBags: productFromList.totalBags || productFromList.bags || 0,
          bags: productFromList.bags || 0,
        };
      }
    }

    return productDetail;
  };

  const calculateProductDetails = (product, index) => {
    const productDetail = getProductDetailForDisplay(product);
    if (!productDetail) return null;

    const bags = parseFloat(product.bags) || 0;
    const bagSize = parseFloat(product.bagSize) || 0;
    const totalBags = parseFloat(product.totalBags) || 0;
    const quantityMT = parseFloat(product.quantityMT) || 0;

    return {
      productDetail,
      bags,
      bagSize,
      totalBags,
      quantityMT,
    };
  };

  // Debug log to check if show prop is working
  console.log("WarehouseForm - show prop:", show);

  // Don't return null early - render the modal conditionally
  return (
    <>
      {show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop with reduced opacity */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-30"
              onClick={handleClose}
            ></div>

            {/* Modal Container */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full relative z-10">
              {/* Modal Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start w-full">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaWarehouse className="mr-2 text-green-500" />
                        <h4 className="text-lg font-semibold text-gray-900 m-0">
                          {mode === "edit" ? "Edit" : "Add"} Railhead to
                          Warehouse/Party TP Pass
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {mode === "add" && (
                          <button
                            onClick={() => onFormTypeChange(null)}
                            disabled={isLoading}
                            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            Change Type
                          </button>
                        )}
                        <button
                          onClick={handleClose}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <FaTimes className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Info Alert */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                      <div className="flex items-center">
                        <FaWarehouse className="mr-2 text-blue-500" />
                        <div>
                          <strong className="text-blue-700">
                            TP Pass Type:
                          </strong>{" "}
                          Railhead to Warehouse/Party
                          <div className="text-sm text-blue-600 mt-1">
                            <strong>Issued by:</strong> {formData.issuedBy} •{" "}
                            <strong>Received by:</strong> {formData.receivedBy}
                            {formData.receivedByType &&
                              ` (${formData.receivedByType})`}
                            {formData.receivedByType === "warehouse" &&
                              formData.receivedByWarehouseName &&
                              ` • ${formData.receivedByWarehouseName}`}
                          </div>
                          {warehouseDisplayMode === "auto-filled" && (
                            <div className="text-sm text-green-600 mt-1">
                              <FaWarehouse className="mr-1" />
                              Warehouse in products section will be auto-filled
                              from selected warehouse above
                            </div>
                          )}
                          {warehouseDisplayMode === "hidden" && (
                            <div className="text-sm text-yellow-600 mt-1">
                              <FaUserFriends className="mr-1" />
                              Warehouse field is hidden in products section when
                              received by party
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={onSubmit} className="space-y-6">
                      {/* Issued/Received Section */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Issued & Received Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Issued By
                            </label>
                            <input
                              type="text"
                              value="Railhead"
                              readOnly
                              disabled={isLoading}
                              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Received By
                            </label>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                {receivedByOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                      handleReceivedByTypeChange(option.value)
                                    }
                                    disabled={isLoading}
                                    className={`flex items-center px-4 py-2 rounded border ${
                                      formData.receivedByType ===
                                        option.value ||
                                      (option.value === "party" &&
                                        formData.receivedBy === "Party") ||
                                      (option.value === "warehouse" &&
                                        formData.receivedBy === "Warehouse")
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    {option.icon}
                                    {option.label}
                                  </button>
                                ))}
                              </div>

                              {formData.receivedByType === "warehouse" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Warehouse
                                  </label>
                                  <Select
                                    value={getReceivedByWarehouseValue()}
                                    onChange={handleWarehouseSelect}
                                    options={receivedByWarehouseOptions}
                                    placeholder="Select Warehouse"
                                    isClearable
                                    isLoading={isLoading || isRailHeadFetching}
                                  />
                                  {formData.receivedByWarehouseName && (
                                    <p className="text-green-600 text-sm mt-1">
                                      Selected:{" "}
                                      {formData.receivedByWarehouseName}
                                    </p>
                                  )}
                                </div>
                              )}

                              {formData.receivedByType === "party" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Party
                                  </label>
                                  <input
                                    type="text"
                                    value={formData.receivedBy}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        receivedBy: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter party name"
                                    disabled={isLoading}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Company Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Company Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Company Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={getCompanyValue()}
                              onChange={(selected) => {
                                if (selected) {
                                  const selectedCompany = companyList.find(
                                    (c) => c.id === selected.value,
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    companyId: selectedCompany?.id || "",
                                    companyName:
                                      selectedCompany?.companyName || "",
                                    companyEmail: selectedCompany?.email || "",
                                    companyMobileNumber:
                                      selectedCompany?.mobileNumber || "",
                                    companyOfficeNumber:
                                      selectedCompany?.officeNumber || "",
                                    companyAddress:
                                      selectedCompany?.address || "",
                                    gstIn: selectedCompany?.gstNumber || "",
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    companyId: "",
                                    companyName: "",
                                    companyEmail: "",
                                    companyMobileNumber: "",
                                    companyOfficeNumber: "",
                                    companyAddress: "",
                                    gstIn: "",
                                  }));
                                }
                              }}
                              options={companyOptions}
                              placeholder="Select Company"
                              isClearable
                              isLoading={isLoading || isRailHeadFetching}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Basic Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Basic Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="date"
                              value={formData.date || getTodayDate()}
                              onChange={handleChange}
                              required
                              disabled={isLoading}
                              max={getTodayDate()}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Vehicle Name (Lorry Number){" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <CreatableSelect
                              value={getVehicleValue()}
                              onChange={handleVehicleChange}
                              options={vehicleOptions}
                              placeholder="Select or type new vehicle"
                              isClearable
                              isLoading={isLoading || isRailHeadFetching}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Driver Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <CreatableSelect
                              value={getDriverValue()}
                              onChange={handleDriverChange}
                              options={driverOptions}
                              placeholder="Select or type new driver"
                              isClearable
                              isLoading={isLoading || isRailHeadFetching}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Consignor Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Consignor Details
                        </h5>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Consignor Name
                              <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={getConsignorValue()}
                              onChange={handleConsignorChange}
                              options={consignorOptions}
                              placeholder="Select Consignor"
                              isClearable
                              isLoading={isLoading || isFetchingConsignor}
                              onInputChange={handleConsignorInputChange}
                              onMenuScrollToBottom={
                                handleConsignorMenuScrollToBottom
                              }
                              filterOption={null}
                              noOptionsMessage={({ inputValue }) =>
                                inputValue
                                  ? `No consignor found for "${inputValue}"`
                                  : "Type to search consignor"
                              }
                            />
                            {isFetchingConsignor && (
                              <p className="text-blue-600 text-sm mt-1">
                                Searching...
                              </p>
                            )}
                          </div>
                          {formData.consignorAddress && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Consignor Address
                              </label>
                              <input
                                value={formData.consignorAddress}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Consignee Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Consignee Details
                        </h5>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Consignee Name
                              <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={getConsigneeValue()}
                              onChange={handleConsigneeChange}
                              options={consigneeOptions}
                              placeholder="Select Consignee"
                              isClearable
                              isLoading={isLoading || isFetchingConsignee}
                              onInputChange={handleConsigneeInputChange}
                              onMenuScrollToBottom={
                                handleConsigneeMenuScrollToBottom
                              }
                              filterOption={null}
                              noOptionsMessage={({ inputValue }) =>
                                inputValue
                                  ? `No consignee found for "${inputValue}"`
                                  : "Type to search consignee"
                              }
                            />
                            {isFetchingConsignee && (
                              <p className="text-blue-600 text-sm mt-1">
                                Searching...
                              </p>
                            )}
                          </div>
                          {formData.consigneeAddress && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Consignee Address
                              </label>
                              <input
                                value={formData.consigneeAddress}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Material Owner Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Material Owner Details
                        </h5>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Material Owner Name
                            </label>
                            <Select
                              value={getMaterialOwnerValue()}
                              onChange={handleMaterialOwnerChange}
                              options={materialOwnerOptions}
                              placeholder="Select Material Owner"
                              isClearable
                              isLoading={isLoading || isFetchingMaterialOwner}
                              onInputChange={handleMaterialOwnerInputChange}
                              onMenuScrollToBottom={
                                handleMaterialOwnerMenuScrollToBottom
                              }
                              filterOption={null}
                              noOptionsMessage={({ inputValue }) =>
                                inputValue
                                  ? `No material owner found for "${inputValue}"`
                                  : "Type to search material owner"
                              }
                            />
                            {isFetchingMaterialOwner && (
                              <p className="text-blue-600 text-sm mt-1">
                                Searching...
                              </p>
                            )}
                          </div>
                          {formData.materialOwnerAddress && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Material Owner Address
                              </label>
                              <input
                                value={formData.materialOwnerAddress}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Route Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Route Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Location{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              name="startLocation"
                              value={formData.startLocation}
                              onChange={handleChange}
                              disabled={isLoading}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Location{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              name="endLocation"
                              value={formData.endLocation}
                              onChange={handleChange}
                              disabled={isLoading}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Product Details
                        </h5>
                        <div className="mb-4">
                          {formData.products.map((product, index) => {
                            const calculations = calculateProductDetails(
                              product,
                              index,
                            );
                            const productDetail =
                              getProductDetailForDisplay(product);
                            const quantityHint = getCalculationHint(
                              index,
                              "quantityMT",
                            );
                            const bagSizeHint = getCalculationHint(
                              index,
                              "bagSize",
                            );
                            const totalBagsHint = getCalculationHint(
                              index,
                              "totalBags",
                            );

                            return (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4 mb-3"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <h6 className="text-sm font-semibold text-gray-700 m-0">
                                    Product {index + 1}
                                  </h6>
                                  {formData.products.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeProduct(index)}
                                      disabled={isLoading}
                                      className="px-3 py-1 text-sm bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 disabled:opacity-50 flex items-center"
                                    >
                                      <FaTrash className="mr-1" />
                                      Remove
                                    </button>
                                  )}
                                </div>

                                {/* Product Details Display */}
                                {productDetail && (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                    <div className="flex items-center mb-2">
                                      <FaInfoCircle className="mr-2 text-blue-500" />
                                      <strong className="text-blue-700">
                                        Product Details from RailHead Inventory:
                                      </strong>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">
                                          Product:
                                        </span>{" "}
                                        <strong className="text-gray-800">
                                          {productDetail.productName}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Available Quantity (MT):
                                        </span>{" "}
                                        <strong
                                          className={
                                            productDetail.quantityMT === 0
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }
                                        >
                                          {productDetail.quantityMT}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Bag Size (kg):
                                        </span>{" "}
                                        <strong
                                          className={
                                            productDetail.bagSize === 0
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }
                                        >
                                          {productDetail.bagSize}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Total Bags:
                                        </span>{" "}
                                        <strong
                                          className={
                                            productDetail.totalBags === 0
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }
                                        >
                                          {productDetail.totalBags}
                                        </strong>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                                  {/* Warehouse field */}
                                  {warehouseDisplayMode === "auto-filled" ? (
                                    <div className="md:col-span-1">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Warehouse{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          product.warehouseName ||
                                          formData.receivedByWarehouseName ||
                                          "Select warehouse above"
                                        }
                                        disabled
                                        readOnly
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 text-sm"
                                      />
                                      <p className="text-green-600 text-xs mt-1">
                                        <FaWarehouse className="inline mr-1" />
                                        Auto-filled from selected warehouse
                                      </p>
                                    </div>
                                  ) : warehouseDisplayMode === "hidden" ? (
                                    <div className="md:col-span-1">
                                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                        <div className="flex items-center text-yellow-700 text-xs">
                                          <FaUserFriends className="mr-2" />
                                          <span>
                                            Warehouse not required when received
                                            by party
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="md:col-span-1">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Warehouse{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <Select
                                        value={getWarehouseValue(product)}
                                        onChange={(selected) =>
                                          handleProductChange(
                                            index,
                                            "warehouseId",
                                            selected ? selected.value : "",
                                          )
                                        }
                                        options={warehouseOptions}
                                        placeholder="Select Warehouse"
                                        isClearable
                                        isLoading={
                                          isLoading || isRailHeadFetching
                                        }
                                        required
                                      />
                                    </div>
                                  )}

                                  {/* Product Select */}
                                  <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Product{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                      value={getProductValue(product)}
                                      onChange={(selected) =>
                                        handleProductChange(
                                          index,
                                          "productId",
                                          selected ? selected.value : "",
                                        )
                                      }
                                      options={productOptions}
                                      placeholder="Select Product"
                                      isClearable
                                      isLoading={
                                        isLoading || isRailHeadFetching
                                      }
                                      required
                                    />
                                    {/* {productDetail && (
                                      <p className="text-blue-600 text-xs mt-1">
                                        <FaBox className="inline mr-1" />
                                        {productDetail.productName} • Available:{" "}
                                        {productDetail.quantityMT} MT • Bag
                                        Size: {productDetail.bagSize} kg • Total
                                        Bags: {productDetail.totalBags}
                                      </p>
                                    )} */}
                                  </div>

                                  {/* Total Bags */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Total Bags
                                    </label>
                                    <input
                                      type="number"
                                      value={product.totalBags}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "totalBags",
                                          e.target.value,
                                        )
                                      }
                                      onWheel={handleNumberInputScroll}
                                      disabled={isLoading}
                                      placeholder="Enter total bags"
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                                    />
                                    {/* {totalBagsHint && (
                                      <p className="text-blue-600 text-xs mt-1 flex items-center">
                                        <FaInfoCircle
                                          className="mr-1"
                                          size={10}
                                        />
                                        {totalBagsHint}
                                      </p>
                                    )} */}
                                  </div>

                                  {/* Bag Size */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Bag Size (kg per bag)
                                    </label>
                                    <input
                                      type="number"
                                      value={product.bagSize}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "bagSize",
                                          e.target.value,
                                        )
                                      }
                                      onWheel={handleNumberInputScroll}
                                      disabled={isLoading}
                                      placeholder="Enter bag size"
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                                      readOnly
                                    />
                                    {/* {bagSizeHint && (
                                      <p className="text-blue-600 text-xs mt-1 flex items-center">
                                        <FaInfoCircle
                                          className="mr-1"
                                          size={10}
                                        />
                                        {bagSizeHint}
                                      </p>
                                    )} */}
                                    <p className="text-gray-500 text-xs mt-1">
                                      Weight per bag in kilograms
                                    </p>
                                  </div>

                                  {/* Quantity (MT) */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Quantity (MT){" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      value={product.quantityMT}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "quantityMT",
                                          e.target.value,
                                        )
                                      }
                                      onWheel={handleNumberInputScroll}
                                      disabled={isLoading}
                                      placeholder="Enter quantity MT"
                                      required
                                      min="0"
                                      step="0.01"
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                                    />
                                    {/* {quantityHint && (
                                      <p className="text-blue-600 text-xs mt-1 flex items-center">
                                        <FaInfoCircle
                                          className="mr-1"
                                          size={10}
                                        />
                                        {quantityHint}
                                      </p>
                                    )} */}
                                    <p className="text-gray-500 text-xs mt-1">
                                      Enter quantity in Metric Ton (1 MT = 1000
                                      kg)
                                    </p>
                                  </div>
                                </div>

                                {/* Show calculation formula example */}
                                {(product.bagSize ||
                                  product.totalBags ||
                                  product.quantityMT) && (
                                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                    <strong>Formula:</strong>
                                    {product.bagSize &&
                                      product.totalBags &&
                                      !product.quantityMT && (
                                        <span className="ml-1">
                                          {product.bagSize} kg ×{" "}
                                          {product.totalBags} bags ={" "}
                                          {(
                                            (product.bagSize *
                                              product.totalBags) /
                                            1000
                                          ).toFixed(3)}{" "}
                                          MT
                                        </span>
                                      )}
                                    {product.bagSize &&
                                      product.quantityMT &&
                                      !product.totalBags && (
                                        <span className="ml-1">
                                          {product.quantityMT} MT × 1000 /{" "}
                                          {product.bagSize} kg ={" "}
                                          {Math.round(
                                            (product.quantityMT * 1000) /
                                              product.bagSize,
                                          )}{" "}
                                          bags
                                        </span>
                                      )}
                                    {product.totalBags &&
                                      product.quantityMT &&
                                      !product.bagSize && (
                                        <span className="ml-1">
                                          {product.quantityMT} MT × 1000 /{" "}
                                          {product.totalBags} bags ={" "}
                                          {(
                                            (product.quantityMT * 1000) /
                                            product.totalBags
                                          ).toFixed(2)}{" "}
                                          kg/bag
                                        </span>
                                      )}
                                    {product.bagSize &&
                                      product.totalBags &&
                                      product.quantityMT && (
                                        <span className="ml-1">
                                          {product.bagSize} kg ×{" "}
                                          {product.totalBags} bags ={" "}
                                          {(
                                            (product.bagSize *
                                              product.totalBags) /
                                            1000
                                          ).toFixed(3)}{" "}
                                          MT
                                        </span>
                                      )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Add Product Button */}
                          <button
                            type="button"
                            onClick={addProduct}
                            disabled={isLoading || isRailHeadFetching}
                            className="px-4 py-2 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            <FaPlus className="mr-2" />
                            Add Another Product
                          </button>
                        </div>
                      </div>

                      {/* Freight Details */}
                      <div>
                        <h5 className="font-semibold border-b pb-2 mb-3 text-gray-700">
                          Freight Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Customer Rate (per MT) (₹)
                            </label>
                            <input
                              type="number"
                              name="customerRate"
                              value={formData.customerRate}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              placeholder="Rate per MT"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Total Amount (₹)
                            </label>
                            <input
                              type="number"
                              name="totalAmount"
                              value={formData.totalAmount}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 text-sm"
                            />
                            {/* <p className="text-blue-600 text-xs mt-1">
                              <FaInfoCircle className="inline mr-1" size={10} />
                              Auto: {totalQuantity.toFixed(3)} MT ×{" "}
                              {formData.customerRate || 0} ={" "}
                              {formData.totalAmount || 0}
                            </p> */}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Transporter Rate (per MT) (₹)
                            </label>
                            <input
                              type="number"
                              name="transporterRate"
                              value={formData.transporterRate}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              placeholder="Rate per MT"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Total Transporter Amount (₹)
                            </label>
                            <input
                              type="number"
                              name="totalTransporterAmount"
                              value={formData.totalTransporterAmount}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 text-sm"
                            />
                            {/* <p className="text-blue-600 text-xs mt-1">
                              <FaInfoCircle className="inline mr-1" size={10} />
                              Auto: {totalQuantity.toFixed(3)} MT ×{" "}
                              {formData.transporterRate || 0} ={" "}
                              {formData.totalTransporterAmount || 0}
                            </p> */}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Transporter Rate On
                            </label>
                            <input
                              type="number"
                              name="transporterRateOn"
                              value={formData.transporterRateOn}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Customer Rate On
                            </label>
                            <input
                              type="number"
                              name="customerRateOn"
                              value={formData.customerRateOn}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Customer Freight (₹)
                            </label>
                            <input
                              type="number"
                              name="customerFreight"
                              value={formData.customerFreight}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Transporter Freight (₹)
                            </label>
                            <input
                              type="number"
                              name="transporterFreight"
                              value={formData.transporterFreight}
                              onChange={handleChange}
                              onWheel={handleNumberInputScroll}
                              disabled={isLoading}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="text-right pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={isLoading || isRailHeadFetching}
                          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                              {mode === "edit" ? "Updating..." : "Creating..."}
                            </span>
                          ) : mode === "edit" ? (
                            "Update Receipt"
                          ) : (
                            "Create Receipt"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WarehouseForm;
