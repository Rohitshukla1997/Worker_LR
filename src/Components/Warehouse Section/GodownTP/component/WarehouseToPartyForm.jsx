import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import {
  DriverApi,
  getCompanyNameApi,
  VehicleApi,
} from "../../../TransportPass/data/data";
import CreatableSelect from "react-select/creatable";
import {
  getConsigneeApi,
  getConsignorApi,
  getWarehouseListApi,
  getWarehouseProfileApi,
} from "../../data/data";
import {
  FaExchangeAlt,
  FaWarehouse,
  FaWeight,
  FaRupeeSign,
  FaUserPlus,
  FaTimes,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-toastify";

const defaultProduct = {
  warehouseId: "",
  warehouseName: "",
  productId: "",
  productName: "",
  quantityMT: "",
  bagSizeKg: "",
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
  tpPassType: "warehouseToParty",
  issuedBy: "Warehouse",
  issuedByWarehouseId: "",
  issuedByWarehouseName: "",
  warehouseId: "",
  receivedBy: "Party",
  receivedByType: "party",
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
  customerName: "",
  customerAddress: "",
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

// Date parsing utility
const parseDateForForm = (dateString) => {
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

// Prevent wheel event on number inputs
const handleNumberInputWheel = (e) => {
  e.target.blur();
};

const WarehouseToPartyForm = ({
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
  const [isCustomVehicle, setIsCustomVehicle] = useState(false);
  const [isCustomDriver, setIsCustomDriver] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [showConsignorModal, setShowConsignorModal] = useState(false);
  const [showConsigneeModal, setShowConsigneeModal] = useState(false);

  // Search states
  const [consignorSearchInput, setConsignorSearchInput] = useState("");
  const [consigneeSearchInput, setConsigneeSearchInput] = useState("");

  // Debounced search values
  const debouncedConsignorSearch = useDebounce(consignorSearchInput, 300);
  const debouncedConsigneeSearch = useDebounce(consigneeSearchInput, 300);

  const [consignorPage, setConsignorPage] = useState(1);
  const [consigneePage, setConsigneePage] = useState(1);
  const itemsPerPage = 20;

  const queryClient = useQueryClient();

  const { data: companyList = [] } = useQuery({
    queryKey: ["companyList"],
    queryFn: getCompanyNameApi,
    staleTime: 1000 * 60 * 30,
  });

  const { data: warehouseResponse = {} } = useQuery({
    queryKey: ["getWarehouseList", { page: 1, limit: 100 }],
    queryFn: ({ queryKey }) => getWarehouseListApi(queryKey[1]),
    staleTime: 1000 * 60 * 30,
  });

  // Fetch consignor data with debounced search
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
    enabled: true,
  });

  // Fetch consignee data with debounced search
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
    enabled: true,
  });

  // Fetch warehouse products when a warehouse is selected
  const {
    data: warehouseProductsResponse = {},
    isLoading: isLoadingWarehouseProducts,
    isError,
    error,
    refetch: refetchWarehouseProducts,
  } = useQuery({
    queryKey: [
      "warehouseProfile",
      {
        id: formData.issuedByWarehouseId,
        search: "",
        page: 1,
        limit: 100,
      },
    ],
    queryFn: getWarehouseProfileApi,
    enabled: !!formData.issuedByWarehouseId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const warehouseList = warehouseResponse?.data || [];

  // Extract products from warehouse response
  const inventoryList = useMemo(() => {
    if (
      !warehouseProductsResponse ||
      !warehouseProductsResponse.data ||
      !Array.isArray(warehouseProductsResponse.data)
    ) {
      return [];
    }
    return warehouseProductsResponse.data || [];
  }, [warehouseProductsResponse]);

  // Create product options - Show ALL products regardless of totalBags value
  const productOptions = useMemo(() => {
    if (!inventoryList || inventoryList.length === 0) {
      return [];
    }

    const options = [];
    const seenCombinations = new Set();

    inventoryList.forEach((product) => {
      const productId = product.productId;
      const productName = product.productName || "Unknown Product";
      const bagSizeKg = product.bagSizeKg || 0;
      const quantityMT = product.quantityMT || 0;
      const totalBags = product.totalBags || 0;

      if (!productId) {
        return;
      }

      const uniqueKey = `${productId}_${bagSizeKg}`;

      if (!seenCombinations.has(uniqueKey)) {
        seenCombinations.add(uniqueKey);

        const label = `${productName} (Bag Size: ${
          bagSizeKg || "0"
        } kg, Available: ${quantityMT} kg, Total Bags: ${totalBags})`;

        options.push({
          value: uniqueKey,
          label: label,
          productId: productId,
          productName: productName,
          bagSizeKg: bagSizeKg,
          quantityMT: quantityMT,
          totalBags: totalBags,
          originalProductData: product,
        });
      }
    });

    console.log("Product options:", options.length, "of", inventoryList.length);
    return options;
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
    if (mode === "edit" && initialData && !isInitialDataLoaded) {
      console.log("Loading initial data for edit:", initialData);

      // Get warehouse info from products
      const firstProduct = initialData.products?.[0];
      const warehouseId = firstProduct?.warehouseId || "";
      const warehouseName = firstProduct?.warehouseName || "";

      // Get vehicle name
      let vehicleName = "";
      if (initialData.vehicleName) {
        vehicleName = initialData.vehicleName;
      } else if (initialData.vehicleId && vehicles.length > 0) {
        const vehicle = vehicles.find((v) => v.id === initialData.vehicleId);
        vehicleName = vehicle?.name || vehicle?.vehicleNumber || "";
      }

      // Get driver name
      let driverName = "";
      if (initialData.driverName) {
        driverName = initialData.driverName;
      } else if (initialData.driverId && drivers.length > 0) {
        const driver = drivers.find((d) => d.id === initialData.driverId);
        driverName = driver?.name || "";
      }

      const updatedFormData = {
        ...defaultFormData,
        ...initialData,
        date: parseDateForForm(initialData.date),
        vehicleName: vehicleName,
        driverName: driverName,
        companyId: initialData.companyId || "",
        consignorId: initialData.consignorId || "",
        consigneeId: initialData.consigneeId || "",
        issuedByWarehouseId: warehouseId,
        issuedByWarehouseName: warehouseName,
        products: initialData.products?.map((product) => {
          const formProduct = {
            ...defaultProduct,
            ...product,
            quantityMT: product.quantityMT?.toString() || "",
            bagSizeKg:
              product.bagSize?.toString() ||
              product.bagSizeKg?.toString() ||
              "",
            totalBags: product.totalBags?.toString() || "",
            warehouseId: product.warehouseId || "",
            warehouseName: product.warehouseName || "",
          };

          if (formProduct.bagSize) {
            delete formProduct.bagSize;
          }

          return formProduct;
        }) || [{ ...defaultProduct }],
      };

      console.log("Updated form data:", updatedFormData);
      setFormData(updatedFormData);
      setIsInitialDataLoaded(true);
    } else if (mode === "add") {
      setFormData(defaultFormData);
      setIsInitialDataLoaded(false);
    }
  }, [initialData, mode, vehicles, drivers, isInitialDataLoaded]);

  // Refetch warehouse products when warehouse ID changes in edit mode
  useEffect(() => {
    if (
      mode === "edit" &&
      formData.issuedByWarehouseId &&
      isInitialDataLoaded
    ) {
      console.log(
        "Refetching warehouse products for ID:",
        formData.issuedByWarehouseId
      );
      refetchWarehouseProducts();
    }
  }, [
    formData.issuedByWarehouseId,
    mode,
    isInitialDataLoaded,
    refetchWarehouseProducts,
  ]);

  // Update product warehouse info when warehouse changes
  useEffect(() => {
    if (formData.issuedByWarehouseId && formData.products.length > 0) {
      const selectedWarehouse = warehouseList.find(
        (w) =>
          w.id === formData.issuedByWarehouseId ||
          w._id === formData.issuedByWarehouseId
      );

      const updatedProducts = formData.products.map((product) => ({
        ...product,
        warehouseId: formData.issuedByWarehouseId,
        warehouseName:
          selectedWarehouse?.wareHouseName ||
          selectedWarehouse?.name ||
          formData.issuedByWarehouseName ||
          "",
      }));

      setFormData((prev) => ({ ...prev, products: updatedProducts }));
    }
  }, [
    formData.issuedByWarehouseId,
    formData.issuedByWarehouseName,
    warehouseList,
  ]);

  // Update vehicle and driver names when vehicles/drivers arrays are loaded
  useEffect(() => {
    if (
      mode === "edit" &&
      formData.vehicleId &&
      vehicles.length > 0 &&
      !formData.vehicleName
    ) {
      const vehicle = vehicles.find((v) => v.id === formData.vehicleId);
      if (vehicle) {
        setFormData((prev) => ({
          ...prev,
          vehicleName: vehicle.name || vehicle.vehicleNumber || "",
        }));
      }
    }
  }, [vehicles, formData.vehicleId, mode]);

  useEffect(() => {
    if (
      mode === "edit" &&
      formData.driverId &&
      drivers.length > 0 &&
      !formData.driverName
    ) {
      const driver = drivers.find((d) => d.id === formData.driverId);
      if (driver) {
        setFormData((prev) => ({
          ...prev,
          driverName: driver.name || "",
        }));
      }
    }
  }, [drivers, formData.driverId, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Vehicle handler
  const handleVehicleChange = (selected, action) => {
    if (selected) {
      if (action.action === "create-option") {
        setFormData((prev) => ({
          ...prev,
          vehicleId: "",
          vehicleName: selected.label,
        }));
        setIsCustomVehicle(true);
      } else {
        const selectedVehicle = vehicles.find(
          (v) => v.id === selected.value || v._id === selected.value
        );
        setFormData((prev) => ({
          ...prev,
          vehicleId: selected.value,
          vehicleName:
            selectedVehicle?.name ||
            selectedVehicle?.vehicleNumber ||
            selected.label,
        }));
        setIsCustomVehicle(false);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicleId: "",
        vehicleName: "",
      }));
      setIsCustomVehicle(false);
    }
  };

  // Driver handler
  const handleDriverChange = (selected, action) => {
    if (selected) {
      if (action.action === "create-option") {
        setFormData((prev) => ({
          ...prev,
          driverId: "",
          driverName: selected.label,
        }));
        setIsCustomDriver(true);
      } else {
        const selectedDriver = drivers.find((d) => d.id === selected.value);
        setFormData((prev) => ({
          ...prev,
          driverId: selected.value,
          driverName: selectedDriver?.name || selected.label,
        }));
        setIsCustomDriver(false);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        driverId: "",
        driverName: "",
      }));
      setIsCustomDriver(false);
    }
  };

  // Handle consignor selection
  const handleConsignorChange = (selected) => {
    if (selected && selected.value !== "create-new") {
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

  // Handle consignee selection
  const handleConsigneeChange = (selected) => {
    if (selected && selected.value !== "create-new") {
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

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];

    if (field === "warehouseId") {
      const selectedWarehouse = warehouseList.find(
        (w) => w.id === value || w._id === value
      );
      updatedProducts[index] = {
        ...updatedProducts[index],
        warehouseId: value,
        warehouseName:
          selectedWarehouse?.wareHouseName || selectedWarehouse?.name || "",
      };
    } else if (field === "productId") {
      const selectedOption = productOptions.find((opt) => opt.value === value);

      if (selectedOption) {
        updatedProducts[index] = {
          ...updatedProducts[index],
          productId: selectedOption.productId,
          productName: selectedOption.productName || "Unknown Product",
          quantityMT: selectedOption.quantityMT?.toString() || "",
          bagSizeKg: selectedOption.bagSizeKg?.toString() || "",
          totalBags: selectedOption.totalBags?.toString() || "",
        };
      }
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value,
      };
    }

    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  const addProduct = () => {
    const newProduct = {
      ...defaultProduct,
      warehouseId: formData.issuedByWarehouseId || "",
      warehouseName: formData.issuedByWarehouseName || "",
    };

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

    if (!formData.companyId) {
      toast.error("Please select a company");
      return;
    }

    if (!formData.startLocation || !formData.endLocation) {
      toast.error("Please enter both start and end locations");
      return;
    }

    const payload = {
      ...formData,
      tpPassType: "warehouseToParty",
      companyId: formData.companyId || "",
      warehouseId: formData.issuedByWarehouseId || "",
      consignorId: formData.consignorId || "",
      consigneeId: formData.consigneeId || "",
      date: formData.date
        ? new Date(formData.date).toISOString()
        : new Date().toISOString(),
      customerRate: parseFloat(formData.customerRate) || 0,
      totalAmount: parseFloat(formData.totalAmount) || 0,
      transporterRate: parseFloat(formData.transporterRate) || 0,
      totalTransporterAmount: parseFloat(formData.totalTransporterAmount) || 0,
      transporterRateOn: parseFloat(formData.transporterRateOn) || 0,
      customerRateOn: parseFloat(formData.customerRateOn) || 0,
      customerFreight: parseFloat(formData.customerFreight) || 0,
      transporterFreight: parseFloat(formData.transporterFreight) || 0,
      products: formData.products.map((product) => {
        const transformedProduct = {
          ...product,
          quantityMT: parseFloat(product.quantityMT) || 0,
          bagSize: parseFloat(product.bagSizeKg) || 0,
          totalBags: parseFloat(product.totalBags) || 0,
        };

        delete transformedProduct.bagSizeKg;
        delete transformedProduct.costPerBag;
        delete transformedProduct.itemCost;

        return transformedProduct;
      }),
    };

    delete payload.bagSizeKg;
    delete payload.workerId;
    delete payload.workerName;
    delete payload.costPerBag;
    delete payload.itemCost;

    if (isCustomVehicle) {
      delete payload.vehicleId;
      payload.vehicleName = formData.vehicleName;
    } else if (formData.vehicleId) {
      payload.vehicleId = formData.vehicleId;
      payload.vehicleName = formData.vehicleName;
    } else {
      delete payload.vehicleId;
      delete payload.vehicleName;
    }

    if (isCustomDriver) {
      delete payload.driverId;
      payload.driverName = formData.driverName;
    } else if (formData.driverId) {
      payload.driverId = formData.driverId;
      payload.driverName = formData.driverName;
    } else {
      delete payload.driverId;
      delete payload.driverName;
    }

    console.log("Submitting payload:", payload);
    handleSubmit(payload);
  };

  const warehouseOptions = warehouseList.map((w) => ({
    value: w.id || w._id,
    label: w.wareHouseName || w.name || "Unnamed Warehouse",
  }));

  const companyOptions = companyList.map((c) => ({
    value: c.id || c._id,
    label: c.companyName || c.name || "Unnamed Company",
  }));

  const consignorOptions = [
    ...consignorData.data.map((consignor) => ({
      value: consignor.id,
      label: consignor.name,
      name: consignor.name,
      address: consignor.address,
    })),
    {
      value: "create-new",
      label: (
        <div className="flex items-center text-blue-600">
          <FaUserPlus className="mr-2" />
          Create New Consignor
        </div>
      ),
      name: "",
      address: "",
    },
  ];

  const consigneeOptions = [
    ...consigneeData.data.map((consignee) => ({
      value: consignee.id,
      label: consignee.name,
      name: consignee.name,
      address: consignee.address,
    })),
    {
      value: "create-new",
      label: (
        <div className="flex items-center text-blue-600">
          <FaUserPlus className="mr-2" />
          Create New Consignee
        </div>
      ),
      name: "",
      address: "",
    },
  ];

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

  const getVehicleValue = () => {
    if (formData.vehicleName) {
      if (formData.vehicleId && !isCustomVehicle) {
        const existingVehicle = vehicleOptions.find(
          (opt) => opt.value === formData.vehicleId
        );
        if (existingVehicle) {
          return existingVehicle;
        }
      }
      return {
        value: formData.vehicleName,
        label: formData.vehicleName,
      };
    }
    if (formData.vehicleId && vehicleOptions.length > 0) {
      const existingVehicle = vehicleOptions.find(
        (opt) => opt.value === formData.vehicleId
      );
      if (existingVehicle) {
        return existingVehicle;
      }
    }
    return null;
  };

  const getDriverValue = () => {
    if (formData.driverName) {
      if (formData.driverId && !isCustomDriver) {
        const existingDriver = driverOptions.find(
          (opt) => opt.value === formData.driverId
        );
        if (existingDriver) {
          return existingDriver;
        }
      }
      return {
        value: formData.driverName,
        label: formData.driverName,
      };
    }
    if (formData.driverId && driverOptions.length > 0) {
      const existingDriver = driverOptions.find(
        (opt) => opt.value === formData.driverId
      );
      if (existingDriver) {
        return existingDriver;
      }
    }
    return null;
  };

  const getWarehouseValue = (product) => {
    if (!product.warehouseId) return null;
    return (
      warehouseOptions.find((opt) => opt.value === product.warehouseId) || null
    );
  };

  const getProductValue = (product) => {
    if (!product.productId) return null;

    if (product.bagSizeKg) {
      const uniqueKey = `${product.productId}_${product.bagSizeKg}`;
      const foundOption = productOptions.find((opt) => opt.value === uniqueKey);
      if (foundOption) return foundOption;
    }

    const foundOption = productOptions.find(
      (opt) => opt.productId === product.productId
    );
    if (foundOption) return foundOption;

    if (product.productId && product.productName && product.bagSizeKg) {
      return {
        value: `${product.productId}_${product.bagSizeKg || "0"}`,
        label: `${product.productName} (Bag Size: ${
          product.bagSizeKg || "0"
        } kg)`,
        productId: product.productId,
        productName: product.productName,
        bagSizeKg: product.bagSizeKg || "0",
        quantityMT: product.quantityMT || "",
        totalBags: product.totalBags || "",
      };
    }

    return null;
  };

  const getCompanyValue = () => {
    if (!formData.companyId) return null;
    return (
      companyOptions.find((opt) => opt.value === formData.companyId) || null
    );
  };

  const getIssuedByWarehouseValue = () => {
    if (!formData.issuedByWarehouseId) return null;
    return (
      warehouseOptions.find(
        (opt) => opt.value === formData.issuedByWarehouseId
      ) || null
    );
  };

  const getConsignorValue = () => {
    if (!formData.consignorName) return null;
    return (
      consignorOptions.find((opt) => opt.name === formData.consignorName) ||
      null
    );
  };

  const getConsigneeValue = () => {
    if (!formData.consigneeName) return null;
    return (
      consigneeOptions.find((opt) => opt.name === formData.consigneeName) ||
      null
    );
  };

  const handleConsignorInputChange = useCallback((value) => {
    setConsignorSearchInput(value);
    setConsignorPage(1);
  }, []);

  const handleConsigneeInputChange = useCallback((value) => {
    setConsigneeSearchInput(value);
    setConsigneePage(1);
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

  if (!show) return null;

  return (
    <>
      {/* Modal Overlay - FIXED: Reduced opacity so form is visible */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Semi-transparent backdrop - REDUCED OPACITY */}
        <div
          className="absolute inset-0 bg-black bg-opacity-30"
          onClick={handleClose}
        ></div>

        {/* Modal Container */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto z-10">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaExchangeAlt className="mr-3 text-yellow-500 text-xl" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    {mode === "edit" ? "Edit" : "Add"} Warehouse to Party TP
                    Pass
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a transport pass from Warehouse to Party
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {mode === "add" && (
                  <button
                    onClick={() => onFormTypeChange(null)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Change Type
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b px-6 py-3">
            <div className="flex items-center">
              <FaExchangeAlt className="mr-3 text-blue-600" />
              <div>
                <span className="font-semibold text-blue-800">
                  TP Pass Type:
                </span>{" "}
                <span className="text-blue-700">Warehouse to Party</span>
                <div className="text-sm text-blue-600 mt-1">
                  <span className="font-medium">Issued by:</span>{" "}
                  {formData.issuedBy}
                  {formData.issuedByWarehouseName &&
                    ` (${formData.issuedByWarehouseName})`}{" "}
                  • <span className="font-medium">Received by:</span>{" "}
                  {formData.receivedBy}
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={onSubmit} className="space-y-8">
              {/* Issued/Received Section */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">
                  Issued & Received Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issued By (Warehouse){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={getIssuedByWarehouseValue()}
                      onChange={(selected) => {
                        if (selected) {
                          const selectedWarehouse = warehouseList.find(
                            (w) =>
                              w.id === selected.value ||
                              w._id === selected.value
                          );
                          const warehouseName =
                            selectedWarehouse?.wareHouseName ||
                            selectedWarehouse?.name ||
                            selected.label;

                          setFormData((prevState) => {
                            const updatedState = {
                              ...prevState,
                              issuedBy: "Warehouse",
                              issuedByWarehouseId: selected.value,
                              issuedByWarehouseName: warehouseName,
                            };

                            if (prevState.products.length > 0) {
                              updatedState.products = prevState.products.map(
                                (product) => ({
                                  ...product,
                                  warehouseId: selected.value,
                                  warehouseName: warehouseName,
                                  productId: product.productId || "",
                                  productName: product.productName || "",
                                })
                              );
                            }

                            return updatedState;
                          });
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            issuedBy: "",
                            issuedByWarehouseId: "",
                            issuedByWarehouseName: "",
                            products: prev.products.map((product) => ({
                              ...product,
                              warehouseId: "",
                              warehouseName: "",
                            })),
                          }));
                        }
                      }}
                      options={warehouseOptions}
                      placeholder="Select Warehouse"
                      isClearable
                      isLoading={isLoading}
                      required
                    />
                    {formData.issuedByWarehouseName && (
                      <div className="mt-2">
                        <div className="flex items-center text-green-700 text-sm">
                          <span className="font-medium">Selected:</span>
                          <span className="ml-2">
                            {formData.issuedByWarehouseName}
                          </span>
                          {isLoadingWarehouseProducts && (
                            <span className="ml-3 flex items-center text-blue-600">
                              <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></span>
                              Loading products...
                            </span>
                          )}
                        </div>
                        {isError && (
                          <div className="mt-1 text-red-600 text-sm">
                            Error: {error?.message || "Failed to load products"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Received By
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value="Party"
                        readOnly
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium"
                      />
                      <div className="absolute right-3 top-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Auto-filled
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                      This is always "Party" for Warehouse to Party TP Pass
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">
                  Company Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={getCompanyValue()}
                      onChange={(selected) => {
                        if (selected) {
                          const selectedCompany = companyList.find(
                            (c) => c.id === selected.value
                          );
                          setFormData((prev) => ({
                            ...prev,
                            companyId: selectedCompany?.id || "",
                            companyName: selectedCompany?.companyName || "",
                            companyEmail: selectedCompany?.email || "",
                            companyMobileNumber:
                              selectedCompany?.mobileNumber || "",
                            companyOfficeNumber:
                              selectedCompany?.officeNumber || "",
                            companyAddress: selectedCompany?.address || "",
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
                      isLoading={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Basic Details */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">
                  Basic Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vehicle Name (Lorry Number){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <CreatableSelect
                      value={getVehicleValue()}
                      onChange={handleVehicleChange}
                      options={vehicleOptions}
                      placeholder="Select or type new vehicle"
                      isClearable
                      isLoading={isLoading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Driver Name <span className="text-red-500">*</span>
                    </label>
                    <CreatableSelect
                      value={getDriverValue()}
                      onChange={handleDriverChange}
                      options={driverOptions}
                      placeholder="Select or type new driver"
                      isClearable
                      isLoading={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Consignor Details */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">
                  Consignor Details
                </h5>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Consignor Name <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={getConsignorValue()}
                      onChange={(selected) => {
                        if (selected && selected.value === "create-new") {
                          setShowConsignorModal(true);
                          handleConsignorChange(null);
                        } else {
                          handleConsignorChange(selected);
                        }
                      }}
                      options={consignorOptions}
                      placeholder="Select Consignor or Create New"
                      isClearable
                      isLoading={isFetchingConsignor}
                      onInputChange={handleConsignorInputChange}
                      onMenuScrollToBottom={handleConsignorMenuScrollToBottom}
                      filterOption={null}
                      noOptionsMessage={({ inputValue }) =>
                        inputValue
                          ? `No consignor found for "${inputValue}"`
                          : "Type to search consignor"
                      }
                      required
                      styles={{
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor:
                            state.data.value === "create-new"
                              ? "#f8f9fa"
                              : provided.backgroundColor,
                          "&:hover": {
                            backgroundColor:
                              state.data.value === "create-new"
                                ? "#e9ecef"
                                : "#f8f9fa",
                          },
                        }),
                      }}
                    />
                    {isFetchingConsignor && (
                      <div className="mt-2 flex items-center text-blue-600 text-sm">
                        <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></span>
                        Searching consignors...
                      </div>
                    )}
                  </div>
                  {formData.consignorAddress && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Consignor Address
                      </label>
                      <input
                        value={formData.consignorAddress}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Consignee Details */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">
                  Consignee Details
                </h5>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Consignee Name <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={getConsigneeValue()}
                      onChange={(selected) => {
                        if (selected && selected.value === "create-new") {
                          setShowConsigneeModal(true);
                          handleConsigneeChange(null);
                        } else {
                          handleConsigneeChange(selected);
                        }
                      }}
                      options={consigneeOptions}
                      placeholder="Select Consignee or Create New"
                      isClearable
                      isLoading={isFetchingConsignee}
                      onInputChange={handleConsigneeInputChange}
                      onMenuScrollToBottom={handleConsigneeMenuScrollToBottom}
                      filterOption={null}
                      noOptionsMessage={({ inputValue }) =>
                        inputValue
                          ? `No consignee found for "${inputValue}"`
                          : "Type to search consignee"
                      }
                      required
                      styles={{
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor:
                            state.data.value === "create-new"
                              ? "#f8f9fa"
                              : provided.backgroundColor,
                          "&:hover": {
                            backgroundColor:
                              state.data.value === "create-new"
                                ? "#e9ecef"
                                : "#f8f9fa",
                          },
                        }),
                      }}
                    />
                    {isFetchingConsignee && (
                      <div className="mt-2 flex items-center text-blue-600 text-sm">
                        <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></span>
                        Searching consignees...
                      </div>
                    )}
                  </div>
                  {formData.consigneeAddress && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Consignee Address
                      </label>
                      <input
                        value={formData.consigneeAddress}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">
                  Customer Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <input
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Customer Address
                    </label>
                    <input
                      name="customerAddress"
                      value={formData.customerAddress}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter customer address"
                    />
                  </div>
                </div>
              </div>

              {/* Route Details */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">
                  Route Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="startLocation"
                      value={formData.startLocation}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter start location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="endLocation"
                      value={formData.endLocation}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Enter end location"
                    />
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-bold text-gray-800 text-lg">
                    Product Details
                  </h5>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      Products available from:{" "}
                    </span>
                    {formData.issuedByWarehouseName ? (
                      <span className="text-green-700 font-semibold">
                        {formData.issuedByWarehouseName}
                      </span>
                    ) : (
                      <span className="text-red-600">
                        Select a warehouse first
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <FaWarehouse className="mr-3 text-yellow-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-800 font-medium mb-1">
                        Product Selection Note
                      </p>
                      <p className="text-yellow-700 text-sm">
                        Products will be loaded from the selected warehouse in
                        the "Issued By" section above.
                        {!formData.issuedByWarehouseId && (
                          <span className="font-semibold ml-1">
                            Please select a warehouse first.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product List */}
                <div className="space-y-6">
                  {formData.products.map((product, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-5 pb-3 border-b">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-blue-700 font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <h6 className="text-base font-semibold text-gray-800">
                            Product {index + 1}
                          </h6>
                        </div>
                        {formData.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center transition-colors"
                          >
                            <FaTrash className="mr-2" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Warehouse - Auto-filled */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Warehouse
                          </label>
                          <input
                            type="text"
                            value={
                              product.warehouseName ||
                              formData.issuedByWarehouseName ||
                              "Not selected"
                            }
                            disabled
                            readOnly
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Auto-filled from warehouse selection
                          </p>
                        </div>

                        {/* Product Selection */}
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Product <span className="text-red-500">*</span>
                          </label>
                          <Select
                            key={`product-select-${index}-${
                              product.productId || "empty"
                            }`}
                            value={getProductValue(product)}
                            onChange={(selected) => {
                              if (selected) {
                                const updatedProduct = {
                                  ...product,
                                  productId: selected.productId,
                                  productName:
                                    selected.productName || "Unknown Product",
                                  quantityMT:
                                    selected.quantityMT?.toString() || "",
                                  bagSizeKg:
                                    selected.bagSizeKg?.toString() || "0",
                                  totalBags:
                                    selected.totalBags?.toString() || "",
                                };

                                const updatedProducts = [...formData.products];
                                updatedProducts[index] = updatedProduct;

                                setFormData((prev) => ({
                                  ...prev,
                                  products: updatedProducts,
                                }));
                              } else {
                                const updatedProducts = [...formData.products];
                                updatedProducts[index] = {
                                  ...product,
                                  productId: "",
                                  productName: "",
                                  quantityMT: "",
                                  bagSizeKg: "",
                                  totalBags: "",
                                };

                                setFormData((prev) => ({
                                  ...prev,
                                  products: updatedProducts,
                                }));
                              }
                            }}
                            options={productOptions}
                            placeholder={
                              isLoadingWarehouseProducts
                                ? "Loading products..."
                                : !formData.issuedByWarehouseId
                                ? "Select a warehouse first"
                                : isError
                                ? "Error loading products"
                                : productOptions.length === 0
                                ? "No products in this warehouse"
                                : "Select product"
                            }
                            isClearable
                            isLoading={isLoadingWarehouseProducts || isLoading}
                            isDisabled={
                              !formData.issuedByWarehouseId ||
                              isLoadingWarehouseProducts ||
                              isLoading ||
                              isError
                            }
                            required
                          />
                        </div>

                        {/* Total Bags */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Total Bags
                          </label>
                          <input
                            type="number"
                            value={product.totalBags}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "totalBags",
                                e.target.value
                              )
                            }
                            disabled={isLoading}
                            placeholder="Enter bags"
                            min="0"
                            onWheel={handleNumberInputWheel}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Total number of bags
                          </p>
                        </div>

                        {/* Bag Size */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Bag Size (kg)
                          </label>
                          <input
                            type="number"
                            value={product.bagSizeKg}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "bagSizeKg",
                                e.target.value
                              )
                            }
                            disabled={isLoading}
                            placeholder="Enter size"
                            min="0"
                            step="0.01"
                            onWheel={handleNumberInputWheel}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Weight per bag in kg
                          </p>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                e.target.value
                              )
                            }
                            disabled={isLoading}
                            placeholder="Enter quantity"
                            min="0.001"
                            step="0.001"
                            required
                            onWheel={handleNumberInputWheel}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Quantity in metric tons
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Product Button */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={addProduct}
                      disabled={isLoading || !formData.issuedByWarehouseId}
                      className="px-6 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
                    >
                      <FaPlus className="mr-3" />
                      <span className="font-medium">Add Another Product</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Freight Details */}
              <div>
                <h5 className="font-bold text-gray-800 text-lg mb-6 pb-2 border-b">
                  Freight Details
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "Customer Rate (₹)", name: "customerRate" },
                    { label: "Total Amount (₹)", name: "totalAmount" },
                    { label: "Transporter Rate (₹)", name: "transporterRate" },
                    {
                      label: "Total Transporter Amount (₹)",
                      name: "totalTransporterAmount",
                    },
                    { label: "Transporter Rate On", name: "transporterRateOn" },
                    { label: "Customer Rate On", name: "customerRateOn" },
                    { label: "Customer Freight (₹)", name: "customerFreight" },
                    {
                      label: "Transporter Freight (₹)",
                      name: "transporterFreight",
                    },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        disabled={isLoading}
                        onWheel={handleNumberInputWheel}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="sticky bottom-0 bg-white border-t pt-6 -mx-6 px-6">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.issuedByWarehouseId}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                        {mode === "edit" ? "Updating..." : "Creating..."}
                      </span>
                    ) : mode === "edit" ? (
                      "Update Receipt"
                    ) : (
                      "Create Receipt"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default WarehouseToPartyForm;
