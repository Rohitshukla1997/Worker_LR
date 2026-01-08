import React, { useState, useRef, useEffect } from "react";
import { FaInfoCircle, FaSave, FaPlus, FaTimes } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import {
  getProductListApi,
  getWarehouseListApi,
  postGodownTPApi,
} from "../Warehouse Section/data/data";

const defaultProduct = {
  warehouseId: "",
  productId: "",
  productName: "",
  quantityKg: "",
  bagSize: "",
  totalBags: "",
};

const defaultFormData = {
  tpPassType: "GrByRoad",
  issuedBy: "Road",
  receivedBy: "Warehouse",
  warehouseId: "",
  products: [{ ...defaultProduct }],
};

const productFields = [
  {
    name: "name",
    label: "Product Name",
    type: "text",
    required: true,
  },
  {
    name: "category",
    label: "Category",
    type: "text",
    required: true,
  },
];

const GrByRoad = ({ setShowForm, setSelectedFormType }) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    category: "",
  });
  const [newProductErrors, setNewProductErrors] = useState({});
  const warehouseSelectRef = useRef(null);
  const productSelectRefs = useRef([]);

  const queryClient = useQueryClient();

  // Initialize refs array
  useEffect(() => {
    productSelectRefs.current = productSelectRefs.current.slice(
      0,
      formData.products.length
    );
  }, [formData.products.length]);

  // Fetch warehouse list
  const { data: warehouseResponse = {}, isFetching: warehouseLoading } =
    useQuery({
      queryKey: [
        "getWarehouseList",
        { search: warehouseSearch, page: 1, limit: 100 },
      ],
      queryFn: ({ queryKey }) => getWarehouseListApi(queryKey[1]),
    });

  // Fetch Product list
  const { data: inventoryResponse = {}, isFetching: inventoryLoading } =
    useQuery({
      queryKey: ["inventoryList", { page: 1, limit: 100 }],
      queryFn: ({ queryKey }) => getProductListApi({ queryKey }),
    });

  // Extract inventory list from response
  const inventoryList = inventoryResponse?.data || [];
  const warehouseList = warehouseResponse?.data || [];

  // Mutation for submitting GR By Road form
  const { mutate: postGrByRoad, isLoading: isSubmitting } = useMutation({
    mutationFn: postGodownTPApi,
    onSuccess: () => {
      toast.success("GR By Road added successfully!");
      queryClient.invalidateQueries({ queryKey: ["getGodownTP"] });
      // Reset form and close if needed
      setFormData(defaultFormData);
      if (setShowForm) setShowForm(false);
      if (setSelectedFormType) setSelectedFormType(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit form");
    },
  });

  // Function to handle wheel event and prevent scrolling from changing number values
  const handleWheel = (e) => {
    e.target.blur();
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProductData((prev) => ({ ...prev, [name]: value }));
    if (newProductErrors[name]) {
      setNewProductErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];

    if (field === "productId") {
      // Find the selected product from inventory list
      const selectedProduct = inventoryList.find((item) => item._id === value);

      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: value,
        productName: selectedProduct ? selectedProduct.productName : "",
      };
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value,
      };

      // Get current values as numbers
      const bagSizeNum = parseFloat(updatedProducts[index].bagSize) || 0;
      const totalBagsNum = parseFloat(updatedProducts[index].totalBags) || 0;
      const quantityMtNum = parseFloat(updatedProducts[index].quantityKg) || 0;

      // Calculate based on the formula: Quantity in MT = (Bag Size × Total Bags) ÷ 1000
      if (field === "bagSize" || field === "totalBags") {
        if (bagSizeNum > 0 && totalBagsNum > 0) {
          const calculatedQuantityMt = (bagSizeNum * totalBagsNum) / 1000;
          updatedProducts[index] = {
            ...updatedProducts[index],
            quantityKg: calculatedQuantityMt.toFixed(3), // Keep 3 decimal places
          };
        }
      }
      // If user manually enters quantityMt, calculate total bags
      else if (field === "quantityKg") {
        if (bagSizeNum > 0 && quantityMtNum > 0) {
          const calculatedTotalBags = Math.round(
            (quantityMtNum * 1000) / bagSizeNum
          );
          updatedProducts[index] = {
            ...updatedProducts[index],
            totalBags: calculatedTotalBags.toString(),
          };
        }
      }
    }

    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { ...defaultProduct }],
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = [...formData.products];
      updatedProducts.splice(index, 1);
      setFormData((prev) => ({ ...prev, products: updatedProducts }));
    }
  };

  const validateNewProduct = () => {
    const errors = {};

    if (!newProductData.name.trim()) {
      errors.name = "Product name is required";
    }
    if (!newProductData.category.trim()) {
      errors.category = "Category is required";
    }

    return errors;
  };

  const handleAddNewProduct = (e) => {
    e.preventDefault();

    const errors = validateNewProduct();
    if (Object.keys(errors).length > 0) {
      setNewProductErrors(errors);
      return;
    }

    // Prepare payload for API
    const payload = {
      name: newProductData.name.trim(),
      category: newProductData.category.trim(),
    };

    postInvenotry(payload);
  };

  const validateForm = () => {
    const errors = {};

    // Validate warehouse selection
    if (!formData.warehouseId) {
      errors.warehouseId = "Warehouse selection is required";
    }

    // Validate each product
    formData.products.forEach((product, index) => {
      if (!product.productId) {
        errors[`productId_${index}`] = `Product selection for product ${
          index + 1
        } is required`;
      }
      if (!product.bagSize || parseFloat(product.bagSize) <= 0) {
        errors[`bagSize_${index}`] = `Valid bag size for product ${
          index + 1
        } is required`;
      }
      if (!product.totalBags || parseInt(product.totalBags) <= 0) {
        errors[`totalBags_${index}`] = `Valid total bags for product ${
          index + 1
        } is required`;
      }
      if (!product.quantityKg || parseFloat(product.quantityKg) <= 0) {
        errors[`quantityKg_${index}`] = `Valid quantity for product ${
          index + 1
        } is required`;
      }
    });

    return errors;
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];

    // Prepare payload for API with current date
    const payload = {
      tpPassType: formData.tpPassType,
      issuedBy: formData.issuedBy,
      receivedBy: "Warehouse",
      warehouseId: formData.warehouseId,
      date: currentDate,
      products: formData.products.map((product) => ({
        warehouseId: formData.warehouseId,
        productId: product.productId,
        productName: product.productName || "",
        quantityKg: parseFloat(product.quantityKg) * 1000,
        bagSize: parseFloat(product.bagSize) || 0,
        totalBags: parseInt(product.totalBags) || 0,
      })),
    };

    // Call mutation
    postGrByRoad(payload);
  };

  // Prepare warehouse options for Select component
  const warehouseOptions = Array.isArray(warehouseList)
    ? warehouseList.map((warehouse) => ({
        value: warehouse._id,
        label: warehouse.wareHouseName || "Unknown Warehouse",
      }))
    : [];

  const getWarehouseValue = () => {
    if (!formData.warehouseId) return null;
    return (
      warehouseOptions.find((opt) => opt.value === formData.warehouseId) || null
    );
  };

  // Handle warehouse selection with clearing
  const handleWarehouseSelect = (selected) => {
    setFormData((prev) => ({
      ...prev,
      warehouseId: selected ? selected.value : "",
    }));

    // Clear warehouse error if exists
    if (formErrors.warehouseId) {
      setFormErrors((prev) => ({ ...prev, warehouseId: "" }));
    }
  };

  // Prepare product options for React Select
  const getProductOptions = () => {
    const productOptions = inventoryList.map((item) => ({
      value: item._id,
      label: `${item.productName}${item.category ? ` (${item.category})` : ""}`,
      productName: item.productName,
    }));

    // Add "Create New Product" option at the beginning
    return [
      {
        value: "new-product",
        label: "+ Create New Product",
        className: "text-primary font-bold",
      },
      ...productOptions,
    ];
  };

  const getProductValue = (productId) => {
    if (!productId) return null;

    // First check inventory list
    const selectedProduct = inventoryList.find(
      (item) => item._id === productId
    );
    if (selectedProduct) {
      return {
        value: selectedProduct._id,
        label: `${selectedProduct.productName}${
          selectedProduct.category ? ` (${selectedProduct.category})` : ""
        }`,
        productName: selectedProduct.productName,
      };
    }

    return null;
  };

  // Handle warehouse search
  const handleWarehouseSearch = (searchValue) => {
    setWarehouseSearch(searchValue);
  };

  // Handle product selection with clearing
  const handleProductSelect = (selected, index) => {
    if (selected === null) {
      const updatedProducts = [...formData.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: "",
        productName: "",
      };
      setFormData((prev) => ({ ...prev, products: updatedProducts }));

      // Clear product error if exists
      if (formErrors[`productId_${index}`]) {
        setFormErrors((prev) => ({ ...prev, [`productId_${index}`]: "" }));
      }
      return;
    }

    // Handle "Create New Product" option
    if (selected?.value === "new-product") {
      setShowNewProductModal(true);
      return;
    }

    // Handle regular product selection
    const selectedProduct = inventoryList.find(
      (item) => item._id === selected?.value
    );

    if (selectedProduct) {
      const updatedProducts = [...formData.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: selectedProduct._id,
        productName: selectedProduct.productName || "",
      };

      setFormData((prev) => ({ ...prev, products: updatedProducts }));

      // Clear product error if exists
      if (formErrors[`productId_${index}`]) {
        setFormErrors((prev) => ({ ...prev, [`productId_${index}`]: "" }));
      }
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData(defaultFormData);
    setFormErrors({});
  };

  // Warehouse dropdown styles
  const warehouseStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderColor: formErrors.warehouseId ? "#dc3545" : "#d1d5db",
      "&:hover": {
        borderColor: formErrors.warehouseId ? "#dc3545" : "#d1d5db",
      },
      boxShadow: state.isFocused
        ? "0 0 0 0.2rem rgba(59, 130, 246, 0.25)"
        : "none",
      width: "100%",
    }),
    container: (base) => ({
      ...base,
      width: "100%",
      position: "relative",
    }),
    menu: (base, state) => {
      let left = 0;
      let top = 0;
      let width = "auto";

      if (warehouseSelectRef.current) {
        const rect = warehouseSelectRef.current.getBoundingClientRect();
        left = rect.left;
        top = rect.bottom;
        width = rect.width;
      }

      return {
        ...base,
        position: "fixed",
        zIndex: 99999,
        left: `${left}px !important`,
        top: `${top}px !important`,
        width: `${width}px !important`,
        maxHeight: "250px",
        overflowY: "auto",
        minWidth: "300px",
        maxWidth: "calc(100vw - 20px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        backgroundColor: "white",
      };
    },
    menuList: (base) => ({
      ...base,
      maxHeight: "200px",
      padding: "4px 0",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#f9fafb"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      padding: "8px 12px",
      fontSize: "14px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      cursor: "pointer",
      "&:active": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#f3f4f6",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 8px",
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: "14px",
      color: "#374151",
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: "14px",
      color: "#6b7280",
    }),
    input: (base) => ({
      ...base,
      fontSize: "14px",
      color: "#374151",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      padding: "0 8px",
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: "4px",
      cursor: "pointer",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: "4px",
      cursor: "pointer",
    }),
  };

  return (
    <>
      <ToastContainer />

      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h4 className="text-xl font-semibold">GR By Road Form</h4>
            </div>
            {setShowForm && (
              <button
                className="bg-white text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                onClick={() => {
                  if (setShowForm) setShowForm(false);
                  if (setSelectedFormType) setSelectedFormType(null);
                }}
                disabled={isSubmitting}
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={onSubmit}>
            {/* Date and Warehouse Selection */}
            <div className="bg-white border border-gray-200 rounded-lg mb-6">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                <h5 className="text-lg font-medium text-gray-900">Details</h5>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString()}
                      readOnly
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Warehouse <span className="text-red-500">*</span>
                    </label>
                    <div ref={warehouseSelectRef}>
                      <Select
                        value={getWarehouseValue()}
                        onChange={handleWarehouseSelect}
                        onInputChange={handleWarehouseSearch}
                        options={warehouseOptions}
                        placeholder="Search and select warehouse"
                        isClearable
                        isLoading={warehouseLoading}
                        filterOption={null}
                        noOptionsMessage={() => "No warehouses found"}
                        isDisabled={isSubmitting}
                        styles={warehouseStyles}
                        menuPosition="fixed"
                        menuPlacement="auto"
                        menuShouldScrollIntoView={false}
                        menuShouldBlockScroll={true}
                        classNamePrefix="select"
                      />
                    </div>
                    {formErrors.warehouseId && (
                      <div className="text-red-500 text-sm mt-1">
                        {formErrors.warehouseId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white border border-gray-200 rounded-lg mb-6">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h5 className="text-lg font-medium text-gray-900">
                    Product Details
                  </h5>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors duration-200"
                    onClick={addProduct}
                    disabled={isSubmitting || inventoryLoading}
                  >
                    <FaPlus className="mr-2" /> Add Product
                  </button>
                </div>
              </div>
              <div className="p-4">
                {inventoryLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading products...
                  </div>
                ) : inventoryList.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                    No products found in inventory. Please add products first.
                  </div>
                ) : (
                  formData.products.map((product, index) => {
                    const createProductStyles = (productIndex) => ({
                      control: (base, state) => ({
                        ...base,
                        minHeight: "38px",
                        borderColor: formErrors[`productId_${productIndex}`]
                          ? "#dc3545"
                          : "#d1d5db",
                        "&:hover": {
                          borderColor: formErrors[`productId_${productIndex}`]
                            ? "#dc3545"
                            : "#d1d5db",
                        },
                        boxShadow: state.isFocused
                          ? "0 0 0 0.2rem rgba(59, 130, 246, 0.25)"
                          : "none",
                        width: "100%",
                      }),
                      container: (base) => ({
                        ...base,
                        width: "100%",
                        position: "relative",
                      }),
                      menu: (base, state) => {
                        const selectElement =
                          productSelectRefs.current[productIndex];
                        let left = 0;
                        let top = 0;
                        let width = "auto";

                        if (selectElement) {
                          const rect = selectElement.getBoundingClientRect();
                          left = rect.left;
                          top = rect.bottom;
                          width = rect.width;
                        }

                        return {
                          ...base,
                          position: "fixed",
                          zIndex: 99999,
                          left: `${left}px !important`,
                          top: `${top}px !important`,
                          width: `${width}px !important`,
                          maxHeight: "250px",
                          overflowY: "auto",
                          minWidth: "300px",
                          maxWidth: "calc(100vw - 20px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          backgroundColor: "white",
                        };
                      },
                      menuList: (base) => ({
                        ...base,
                        maxHeight: "200px",
                        padding: "4px 0",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#3b82f6"
                          : state.isFocused
                          ? "#f9fafb"
                          : "white",
                        color: state.isSelected ? "white" : "#374151",
                        padding: "8px 12px",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                        "&:active": {
                          backgroundColor: state.isSelected
                            ? "#3b82f6"
                            : "#f3f4f6",
                        },
                        fontWeight:
                          state.data?.value === "new-product"
                            ? "bold"
                            : "normal",
                        color:
                          state.data?.value === "new-product"
                            ? "#3b82f6"
                            : base.color,
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        padding: "2px 8px",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        fontSize: "14px",
                        color: "#374151",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        fontSize: "14px",
                        color: "#6b7280",
                      }),
                      input: (base) => ({
                        ...base,
                        fontSize: "14px",
                        color: "#374151",
                      }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        padding: "0 8px",
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        padding: "4px",
                        cursor: "pointer",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: "4px",
                        cursor: "pointer",
                      }),
                    });

                    const productStyles = createProductStyles(index);

                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg mb-4"
                      >
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <h6 className="text-base font-medium text-gray-900">
                              Product {index + 1}
                            </h6>
                            {formData.products.length > 1 && (
                              <button
                                type="button"
                                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200"
                                onClick={() => removeProduct(index)}
                                disabled={isSubmitting}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Product Selection Dropdown */}
                            <div className="lg:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Product{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div
                                ref={(el) => {
                                  if (el) {
                                    productSelectRefs.current[index] = el;
                                  }
                                }}
                              >
                                <Select
                                  instanceId={`product-select-${index}`}
                                  value={getProductValue(product.productId)}
                                  onChange={(selected) =>
                                    handleProductSelect(selected, index)
                                  }
                                  options={getProductOptions()}
                                  placeholder="Search product"
                                  isClearable
                                  isSearchable
                                  isLoading={inventoryLoading}
                                  isDisabled={isSubmitting}
                                  styles={productStyles}
                                  menuPosition="fixed"
                                  menuPlacement="auto"
                                  menuShouldScrollIntoView={false}
                                  menuShouldBlockScroll={true}
                                  filterOption={(option, inputValue) => {
                                    if (option.value === "new-product")
                                      return true;
                                    if (!inputValue) return true;
                                    return option.label
                                      .toLowerCase()
                                      .includes(inputValue.toLowerCase());
                                  }}
                                  noOptionsMessage={({ inputValue }) =>
                                    inputValue
                                      ? `No products found for "${inputValue}"`
                                      : "No products available"
                                  }
                                  classNamePrefix="select"
                                />
                              </div>
                              {formErrors[`productId_${index}`] && (
                                <div className="text-red-500 text-sm mt-1">
                                  {formErrors[`productId_${index}`]}
                                </div>
                              )}
                            </div>

                            {/* Bag Size */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bag Size (kg){" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={product.bagSize}
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "bagSize",
                                    e.target.value
                                  )
                                }
                                onWheel={handleWheel}
                                disabled={isSubmitting}
                                placeholder="e.g., 50"
                                min="0.01"
                                step="0.01"
                                className={`w-full border ${
                                  formErrors[`bagSize_${index}`]
                                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                } text-gray-900 text-sm rounded-lg p-2.5`}
                              />
                              {formErrors[`bagSize_${index}`] && (
                                <div className="text-red-500 text-sm mt-1">
                                  {formErrors[`bagSize_${index}`]}
                                </div>
                              )}
                            </div>

                            {/* Total Bags */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Bags{" "}
                                <span className="text-red-500">*</span>
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
                                onWheel={handleWheel}
                                disabled={isSubmitting}
                                placeholder="e.g., 100"
                                min="1"
                                step="1"
                                className={`w-full border ${
                                  formErrors[`totalBags_${index}`]
                                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                } text-gray-900 text-sm rounded-lg p-2.5`}
                              />
                              {formErrors[`totalBags_${index}`] && (
                                <div className="text-red-500 text-sm mt-1">
                                  {formErrors[`totalBags_${index}`]}
                                </div>
                              )}
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity (MT){" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={product.quantityKg}
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "quantityKg",
                                    e.target.value
                                  )
                                }
                                onWheel={handleWheel}
                                disabled={isSubmitting}
                                placeholder="e.g., 5"
                                className={`w-full border ${
                                  formErrors[`quantityKg_${index}`]
                                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                } bg-gray-50 text-gray-900 text-sm rounded-lg p-2.5`}
                                readOnly
                              />
                              {formErrors[`quantityKg_${index}`] && (
                                <div className="text-red-500 text-sm mt-1">
                                  {formErrors[`quantityKg_${index}`]}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset Form
              </button>
              <div>
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isSubmitting ||
                    inventoryLoading ||
                    inventoryList.length === 0
                  }
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => !isAddingProduct && setShowNewProductModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Modal header */}
              <div className="bg-blue-600 text-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Add New Product</h3>
                  {!isAddingProduct && (
                    <button
                      onClick={() => setShowNewProductModal(false)}
                      className="text-white hover:text-gray-200 focus:outline-none"
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Modal content */}
              <form onSubmit={handleAddNewProduct}>
                <div className="bg-white px-6 pt-5 pb-4">
                  <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
                    <div className="flex items-center">
                      <FaInfoCircle className="mr-2" />
                      Add a new product to the inventory. This product will be
                      available for selection in all forms.
                    </div>
                  </div>

                  {productFields.map((field) => (
                    <div key={field.name} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}{" "}
                        {field.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={newProductData[field.name] || ""}
                        onChange={handleNewProductChange}
                        disabled={isAddingProduct}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className={`w-full border ${
                          newProductErrors[field.name]
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        } text-gray-900 text-sm rounded-lg p-2.5`}
                      />
                      {newProductErrors[field.name] && (
                        <div className="text-red-500 text-sm mt-1">
                          {newProductErrors[field.name]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Modal footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setShowNewProductModal(false)}
                    disabled={isAddingProduct}
                  >
                    <FaTimes className="inline mr-1" /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isAddingProduct}
                  >
                    {isAddingProduct ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2" /> Add Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GrByRoad;
