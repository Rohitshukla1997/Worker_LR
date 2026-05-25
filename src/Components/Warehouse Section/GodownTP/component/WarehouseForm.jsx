import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  DriverApi,
  getCompanyNameApi,
  VehicleApi,
} from "../../../TransportPass/data/data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select, { components } from "react-select";
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
  FaCheck,
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

// Skeleton Option Component for loading state
const SkeletonOption = () => (
  <div className="px-3 py-2">
    <div className="placeholder-glow d-flex align-items-center">
      <span
        className="placeholder col-1 me-2"
        style={{ height: "20px", borderRadius: "4px" }}
      ></span>
      <span
        className="placeholder col-8"
        style={{ height: "20px", borderRadius: "4px" }}
      ></span>
    </div>
  </div>
);

// Scroll Loader Component with skeleton items
const ScrollLoader = ({
  count = 3,
  currentCount,
  totalCount,
  direction = "down",
}) => (
  <div className="border-top pt-2">
    {[...Array(count)].map((_, i) => (
      <SkeletonOption key={i} />
    ))}
    <div className="text-center py-2 small text-muted">
      <div
        className="spinner-border spinner-border-sm me-2"
        role="status"
        style={{ width: "1rem", height: "1rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      Loading {direction === "up" ? "previous" : "more"} items... (
      {currentCount} of {totalCount || "?"} loaded)
    </div>
  </div>
);

// Custom Loading Message Component for initial load
const LoadingMessage = ({ children }) => (
  <div className="d-flex align-items-center justify-content-center py-3">
    <div
      className="spinner-border spinner-border-sm text-primary me-2"
      role="status"
    >
      <span className="visually-hidden">Loading...</span>
    </div>
    <span className="text-muted">{children}</span>
  </div>
);

// Custom MenuList with bidirectional scroll pagination
const CustomMenuList = ({
  children,
  isLoading,
  hasMore,
  hasPrevious,
  onLoadPrevious,
  onLoadMore,
  selectProps,
  ...props
}) => {
  const scrollRef = React.useRef(null);
  const [isLoadingPrevious, setIsLoadingPrevious] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const previousScrollHeight = React.useRef(0);
  const isLoadingRef = React.useRef(false);
  const scrollTimeoutRef = React.useRef(null);

  const handleScroll = (event) => {
    const target = event.target;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const atBottom = scrollHeight - scrollTop <= clientHeight + 50;
      const atTop = scrollTop <= 50;

      if (
        atBottom &&
        !isLoadingRef.current &&
        hasMore &&
        onLoadMore &&
        !isLoadingPrevious
      ) {
        isLoadingRef.current = true;
        setIsLoadingMore(true);
        onLoadMore();
      }

      if (
        atTop &&
        !isLoadingRef.current &&
        hasPrevious &&
        onLoadPrevious &&
        scrollTop > 0 &&
        !isLoadingMore
      ) {
        previousScrollHeight.current = scrollHeight;
        isLoadingRef.current = true;
        setIsLoadingPrevious(true);
        onLoadPrevious();
      }
    }, 100);
  };

  React.useEffect(() => {
    if (
      !isLoading &&
      !isLoadingMore &&
      !isLoadingPrevious &&
      isLoadingRef.current
    ) {
      isLoadingRef.current = false;
    }
  }, [isLoading, isLoadingMore, isLoadingPrevious]);

  React.useEffect(() => {
    if (
      !isLoadingPrevious &&
      previousScrollHeight.current > 0 &&
      scrollRef.current
    ) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      if (scrollDiff > 0) {
        scrollRef.current.scrollTop = scrollDiff;
      }
      previousScrollHeight.current = 0;
      setTimeout(() => {
        setIsLoadingPrevious(false);
      }, 100);
    }
  }, [isLoadingPrevious]);

  React.useEffect(() => {
    if (!isLoading && isLoadingMore) {
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 100);
    }
  }, [isLoading, isLoadingMore]);

  const selectedValue = selectProps.value?.value;
  const hasSelectedItemNotInList =
    selectedValue &&
    !selectProps.options?.some(
      (opt) =>
        opt.value === selectedValue &&
        opt.value !== "separator" &&
        opt.value !== "header",
    );
  const currentCount =
    selectProps.options?.filter(
      (opt) => opt.value !== "separator" && opt.value !== "header",
    ).length || 0;
  const totalCount = selectProps.totalCount || 0;

  React.useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [hasMore, hasPrevious]);

  return (
    <div ref={scrollRef} style={{ maxHeight: "300px", overflowY: "auto" }}>
      {isLoadingPrevious && (
        <ScrollLoader
          count={2}
          currentCount={currentCount}
          totalCount={totalCount}
          direction="up"
        />
      )}
      {hasSelectedItemNotInList && (
        <div className="px-3 py-2 small bg-light border-bottom">
          <FaCheck className="me-1 text-success" size={10} />
          <span className="text-muted">
            Currently selected item shown in list
          </span>
        </div>
      )}
      {children}
      {isLoadingMore && (
        <ScrollLoader
          count={3}
          currentCount={currentCount}
          totalCount={totalCount}
          direction="down"
        />
      )}
      {!isLoading &&
        !hasMore &&
        currentCount > 0 &&
        !isLoadingPrevious &&
        !isLoadingMore && (
          <div className="text-center py-2 text-muted small border-top">
            <FaCheck className="me-1 text-success" size={10} />
            <span>All {currentCount} items loaded</span>
          </div>
        )}
    </div>
  );
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

  const [hasMoreConsignor, setHasMoreConsignor] = useState(true);
  const [hasMoreConsignee, setHasMoreConsignee] = useState(true);
  const [hasMoreMaterialOwner, setHasMoreMaterialOwner] = useState(true);

  const [hasPreviousConsignor, setHasPreviousConsignor] = useState(false);
  const [hasPreviousConsignee, setHasPreviousConsignee] = useState(false);
  const [hasPreviousMaterialOwner, setHasPreviousMaterialOwner] =
    useState(false);

  // State for cumulative data storage (for infinite scroll)
  const [allConsignors, setAllConsignors] = useState([]);
  const [allConsignees, setAllConsignees] = useState([]);
  const [allMaterialOwners, setAllMaterialOwners] = useState([]);

  // Track which pages have been loaded
  const [loadedConsignorPages, setLoadedConsignorPages] = useState(new Set());
  const [loadedConsigneePages, setLoadedConsigneePages] = useState(new Set());
  const [loadedMaterialOwnerPages, setLoadedMaterialOwnerPages] = useState(
    new Set(),
  );

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

  // Fetch Consignor data with pagination
  const {
    data: consignorData = { data: [], total: 0 },
    isFetching: isFetchingConsignor,
    isPreviousData: isPreviousConsignorData,
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
    onSuccess: (data) => {
      const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);
      setHasMoreConsignor(consignorPage < totalPages);
      setHasPreviousConsignor(consignorPage > 1);
    },
  });

  // Fetch Consignee data with pagination
  const {
    data: consigneeData = { data: [], total: 0 },
    isFetching: isFetchingConsignee,
    isPreviousData: isPreviousConsigneeData,
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
    onSuccess: (data) => {
      const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);
      setHasMoreConsignee(consigneePage < totalPages);
      setHasPreviousConsignee(consigneePage > 1);
    },
  });

  // Fetch Material Owner data with pagination
  const {
    data: materialOwnerData = { data: [], total: 0 },
    isFetching: isFetchingMaterialOwner,
    isPreviousData: isPreviousMaterialOwnerData,
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
    onSuccess: (data) => {
      const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);
      setHasMoreMaterialOwner(materialOwnerPage < totalPages);
      setHasPreviousMaterialOwner(materialOwnerPage > 1);
    },
  });

  const warehouseList = warehouseResponse?.data || [];
  const inventoryList = railHeadData?.data || [];
  const consignorList = consignorData?.data || [];
  const consigneeList = consigneeData?.data || [];
  const materialOwnerList = materialOwnerData?.data || [];

  // ACCUMULATION EFFECTS - Must come AFTER the queries
  useEffect(() => {
    if (consignorData?.data && consignorData.data.length > 0) {
      const newItems = consignorData.data.filter(
        (item) => !allConsignors.some((existing) => existing.id === item.id),
      );

      if (newItems.length > 0) {
        if (consignorPage === 1) {
          setAllConsignors(consignorData.data);
        } else if (
          consignorPage < Math.min(...Array.from(loadedConsignorPages))
        ) {
          setAllConsignors((prev) => [...newItems, ...prev]);
        } else {
          setAllConsignors((prev) => [...prev, ...newItems]);
        }
      }

      setLoadedConsignorPages((prev) => new Set([...prev, consignorPage]));
    }
  }, [consignorData?.data, consignorPage]);

  useEffect(() => {
    if (consigneeData?.data && consigneeData.data.length > 0) {
      const newItems = consigneeData.data.filter(
        (item) => !allConsignees.some((existing) => existing.id === item.id),
      );

      if (newItems.length > 0) {
        if (consigneePage === 1) {
          setAllConsignees(consigneeData.data);
        } else if (
          consigneePage < Math.min(...Array.from(loadedConsigneePages))
        ) {
          setAllConsignees((prev) => [...newItems, ...prev]);
        } else {
          setAllConsignees((prev) => [...prev, ...newItems]);
        }
      }

      setLoadedConsigneePages((prev) => new Set([...prev, consigneePage]));
    }
  }, [consigneeData?.data, consigneePage]);

  useEffect(() => {
    if (materialOwnerData?.data && materialOwnerData.data.length > 0) {
      const newItems = materialOwnerData.data.filter(
        (item) =>
          !allMaterialOwners.some((existing) => existing.id === item.id),
      );

      if (newItems.length > 0) {
        if (materialOwnerPage === 1) {
          setAllMaterialOwners(materialOwnerData.data);
        } else if (
          materialOwnerPage < Math.min(...Array.from(loadedMaterialOwnerPages))
        ) {
          setAllMaterialOwners((prev) => [...newItems, ...prev]);
        } else {
          setAllMaterialOwners((prev) => [...prev, ...newItems]);
        }
      }

      setLoadedMaterialOwnerPages(
        (prev) => new Set([...prev, materialOwnerPage]),
      );
    }
  }, [materialOwnerData?.data, materialOwnerPage]);

  // Load more handlers (scroll down)
  const loadMoreConsignors = useCallback(() => {
    if (!isFetchingConsignor && hasMoreConsignor && !isPreviousConsignorData) {
      setConsignorPage((prev) => prev + 1);
    }
  }, [isFetchingConsignor, hasMoreConsignor, isPreviousConsignorData]);

  const loadMoreConsignees = useCallback(() => {
    if (!isFetchingConsignee && hasMoreConsignee && !isPreviousConsigneeData) {
      setConsigneePage((prev) => prev + 1);
    }
  }, [isFetchingConsignee, hasMoreConsignee, isPreviousConsigneeData]);

  const loadMoreMaterialOwners = useCallback(() => {
    if (
      !isFetchingMaterialOwner &&
      hasMoreMaterialOwner &&
      !isPreviousMaterialOwnerData
    ) {
      setMaterialOwnerPage((prev) => prev + 1);
    }
  }, [
    isFetchingMaterialOwner,
    hasMoreMaterialOwner,
    isPreviousMaterialOwnerData,
  ]);

  // Load previous handlers (scroll up)
  const loadPreviousConsignors = useCallback(() => {
    if (!isFetchingConsignor && consignorPage > 1 && !isPreviousConsignorData) {
      setConsignorPage((prev) => prev - 1);
    }
  }, [isFetchingConsignor, consignorPage, isPreviousConsignorData]);

  const loadPreviousConsignees = useCallback(() => {
    if (!isFetchingConsignee && consigneePage > 1 && !isPreviousConsigneeData) {
      setConsigneePage((prev) => prev - 1);
    }
  }, [isFetchingConsignee, consigneePage, isPreviousConsigneeData]);

  const loadPreviousMaterialOwners = useCallback(() => {
    if (
      !isFetchingMaterialOwner &&
      materialOwnerPage > 1 &&
      !isPreviousMaterialOwnerData
    ) {
      setMaterialOwnerPage((prev) => prev - 1);
    }
  }, [isFetchingMaterialOwner, materialOwnerPage, isPreviousMaterialOwnerData]);

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
    setHasMoreConsignor(true);
    setHasPreviousConsignor(false);
    setAllConsignors([]);
    setLoadedConsignorPages(new Set());
  }, []);

  const handleConsigneeInputChange = useCallback((value) => {
    setConsigneeSearchInput(value);
    setConsigneePage(1);
    setHasMoreConsignee(true);
    setHasPreviousConsignee(false);
    setAllConsignees([]);
    setLoadedConsigneePages(new Set());
  }, []);

  const handleMaterialOwnerInputChange = useCallback((value) => {
    setMaterialOwnerSearchInput(value);
    setMaterialOwnerPage(1);
    setHasMoreMaterialOwner(true);
    setHasPreviousMaterialOwner(false);
    setAllMaterialOwners([]);
    setLoadedMaterialOwnerPages(new Set());
  }, []);

  // Extract product details
  useEffect(() => {
    if (inventoryList.length > 0) {
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

    if (
      field === "bagSize" ||
      field === "totalBags" ||
      field === "quantityMT"
    ) {
      setCalculationSource((prev) => ({ ...prev, [index]: field }));
    }

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

    // FIX: Convert empty strings to null/undefined for ObjectId fields
    const getObjectIdValue = (value) => {
      if (!value || value === "" || typeof value !== "string") {
        return null; // or undefined - both work better than empty string
      }
      // Optional: Validate if it looks like a MongoDB ObjectId (24 hex chars)
      // if (/^[0-9a-fA-F]{24}$/.test(value)) {
      //   return value;
      // }
      return value;
    };

    const payload = {
      ...formData,
      tpPassType: "warehouse",
      // Fix ObjectId fields
      companyId: getObjectIdValue(formData.companyId),
      materialOwnerId: getObjectIdValue(formData.materialOwnerId), // This is the critical fix
      consignorId: getObjectIdValue(formData.consignorId),
      consigneeId: getObjectIdValue(formData.consigneeId),
      driverId: getObjectIdValue(formData.driverId),
      vehicleId: getObjectIdValue(formData.vehicleId),
      receivedByWarehouseId: getObjectIdValue(formData.receivedByWarehouseId),
      // Keep other fields as is
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
      payload.vehicleName = payload.vehicleId;
      delete payload.vehicleId;
    }

    if (!driverExistsInDb && payload.driverId) {
      payload.driverName = payload.driverId;
      delete payload.driverId;
    }

    // Remove any null/undefined values from payload (optional but cleaner)
    Object.keys(payload).forEach((key) => {
      if (payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

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

    handleSubmit(payload);
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

  // Options with selected item persistence for Consignor (using accumulated data)
  const consignorOptions = useMemo(() => {
    const options = [];

    if (allConsignors.length > 0) {
      options.push({
        value: "header",
        label: (
          <div className="text-muted small fw-semibold py-1 px-2 bg-light">
            Existing Consignors
          </div>
        ),
        isDisabled: true,
        name: "",
        address: "",
      });
    }

    if (formData.consignorId && formData.consignorName) {
      const isSelectedInList = allConsignors.some(
        (c) => c.id === formData.consignorId,
      );
      if (!isSelectedInList) {
        options.push({
          value: formData.consignorId,
          label: (
            <div className="d-flex align-items-center">
              <FaCheck className="text-success me-2" size={12} />
              <span>{formData.consignorName}</span>
              <span
                className="badge bg-success ms-2"
                style={{ fontSize: "10px" }}
              >
                Selected
              </span>
            </div>
          ),
          name: formData.consignorName,
          address: formData.consignorAddress || "",
        });
      }
    }

    allConsignors.forEach((consignor) => {
      if (consignor.id === formData.consignorId) {
        options.push({
          value: consignor.id,
          label: (
            <div className="d-flex align-items-center">
              <FaCheck className="text-success me-2" size={12} />
              <span>{consignor.name}</span>
              <span
                className="badge bg-success ms-2"
                style={{ fontSize: "10px" }}
              >
                Selected
              </span>
            </div>
          ),
          name: consignor.name,
          address: consignor.address,
        });
      } else {
        options.push({
          value: consignor.id,
          label: consignor.name,
          name: consignor.name,
          address: consignor.address,
        });
      }
    });

    return options;
  }, [
    allConsignors,
    formData.consignorId,
    formData.consignorName,
    formData.consignorAddress,
  ]);

  // Options with selected item persistence for Consignee (using accumulated data)
  const consigneeOptions = useMemo(() => {
    const options = [];

    if (allConsignees.length > 0) {
      options.push({
        value: "header",
        label: (
          <div className="text-muted small fw-semibold py-1 px-2 bg-light">
            Existing Consignees
          </div>
        ),
        isDisabled: true,
        name: "",
        address: "",
      });
    }

    if (formData.consigneeId && formData.consigneeName) {
      const isSelectedInList = allConsignees.some(
        (c) => c.id === formData.consigneeId,
      );
      if (!isSelectedInList) {
        options.push({
          value: formData.consigneeId,
          label: (
            <div className="d-flex align-items-center">
              <FaCheck className="text-success me-2" size={12} />
              <span>{formData.consigneeName}</span>
              <span
                className="badge bg-success ms-2"
                style={{ fontSize: "10px" }}
              >
                Selected
              </span>
            </div>
          ),
          name: formData.consigneeName,
          address: formData.consigneeAddress || "",
        });
      }
    }

    allConsignees.forEach((consignee) => {
      if (consignee.id === formData.consigneeId) {
        options.push({
          value: consignee.id,
          label: (
            <div className="d-flex align-items-center">
              <FaCheck className="text-success me-2" size={12} />
              <span>{consignee.name}</span>
              <span
                className="badge bg-success ms-2"
                style={{ fontSize: "10px" }}
              >
                Selected
              </span>
            </div>
          ),
          name: consignee.name,
          address: consignee.address,
        });
      } else {
        options.push({
          value: consignee.id,
          label: consignee.name,
          name: consignee.name,
          address: consignee.address,
        });
      }
    });

    return options;
  }, [
    allConsignees,
    formData.consigneeId,
    formData.consigneeName,
    formData.consigneeAddress,
  ]);

  // Options for Material Owner (using accumulated data)
  const materialOwnerOptions = useMemo(() => {
    const options = allMaterialOwners.map((owner) => ({
      value: owner.id,
      label: owner.name,
      name: owner.name,
      address: owner.address || "",
    }));

    if (formData.materialOwnerId && formData.materialOwnerName) {
      const isSelectedInList = options.some(
        (opt) => opt.value === formData.materialOwnerId,
      );
      if (!isSelectedInList) {
        options.unshift({
          value: formData.materialOwnerId,
          label: (
            <div className="d-flex align-items-center">
              <FaCheck className="text-success me-2" size={12} />
              <span>{formData.materialOwnerName}</span>
              <span
                className="badge bg-success ms-2"
                style={{ fontSize: "10px" }}
              >
                Selected
              </span>
            </div>
          ),
          name: formData.materialOwnerName,
          address: formData.materialOwnerAddress || "",
        });
      }
    }

    return options;
  }, [
    allMaterialOwners,
    formData.materialOwnerId,
    formData.materialOwnerName,
    formData.materialOwnerAddress,
  ]);

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
    if (!formData.consignorId && !formData.consignorName) return null;
    return (
      consignorOptions.find(
        (opt) =>
          opt.value === formData.consignorId ||
          opt.name === formData.consignorName,
      ) || null
    );
  };

  const getConsigneeValue = () => {
    if (!formData.consigneeId && !formData.consigneeName) return null;
    return (
      consigneeOptions.find(
        (opt) =>
          opt.value === formData.consigneeId ||
          opt.name === formData.consigneeName,
      ) || null
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

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-30"
              onClick={handleClose}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full relative z-10">
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

                      {/* Consignor Details with Bidirectional Infinite Scroll */}
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
                              isLoading={
                                isFetchingConsignor && consignorPage === 1
                              }
                              onInputChange={handleConsignorInputChange}
                              filterOption={null}
                              noOptionsMessage={({ inputValue }) =>
                                inputValue
                                  ? `No consignor found for "${inputValue}"`
                                  : "Type to search consignor"
                              }
                              loadingMessage={() => (
                                <LoadingMessage>
                                  Loading consignors...
                                </LoadingMessage>
                              )}
                              components={{
                                MenuList: (props) => (
                                  <CustomMenuList
                                    {...props}
                                    isLoading={isFetchingConsignor}
                                    hasMore={hasMoreConsignor}
                                    hasPrevious={hasPreviousConsignor}
                                    onLoadPrevious={loadPreviousConsignors}
                                    onLoadMore={loadMoreConsignors}
                                    totalCount={consignorData?.total || 0}
                                  />
                                ),
                              }}
                              required
                            />
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

                      {/* Consignee Details with Bidirectional Infinite Scroll */}
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
                              isLoading={
                                isFetchingConsignee && consigneePage === 1
                              }
                              onInputChange={handleConsigneeInputChange}
                              filterOption={null}
                              noOptionsMessage={({ inputValue }) =>
                                inputValue
                                  ? `No consignee found for "${inputValue}"`
                                  : "Type to search consignee"
                              }
                              loadingMessage={() => (
                                <LoadingMessage>
                                  Loading consignees...
                                </LoadingMessage>
                              )}
                              components={{
                                MenuList: (props) => (
                                  <CustomMenuList
                                    {...props}
                                    isLoading={isFetchingConsignee}
                                    hasMore={hasMoreConsignee}
                                    hasPrevious={hasPreviousConsignee}
                                    onLoadPrevious={loadPreviousConsignees}
                                    onLoadMore={loadMoreConsignees}
                                    totalCount={consigneeData?.total || 0}
                                  />
                                ),
                              }}
                              required
                            />
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

                      {/* Material Owner Details with Bidirectional Infinite Scroll */}
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
                              isLoading={
                                isFetchingMaterialOwner &&
                                materialOwnerPage === 1
                              }
                              onInputChange={handleMaterialOwnerInputChange}
                              filterOption={null}
                              noOptionsMessage={({ inputValue }) =>
                                inputValue
                                  ? `No material owner found for "${inputValue}"`
                                  : "Type to search material owner"
                              }
                              loadingMessage={() => (
                                <LoadingMessage>
                                  Loading material owners...
                                </LoadingMessage>
                              )}
                              components={{
                                MenuList: (props) => (
                                  <CustomMenuList
                                    {...props}
                                    isLoading={isFetchingMaterialOwner}
                                    hasMore={hasMoreMaterialOwner}
                                    hasPrevious={hasPreviousMaterialOwner}
                                    onLoadPrevious={loadPreviousMaterialOwners}
                                    onLoadMore={loadMoreMaterialOwners}
                                    totalCount={materialOwnerData?.total || 0}
                                  />
                                ),
                              }}
                            />
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
