import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import Select from "react-select";
import {
  FaInfoCircle,
  FaSave,
  FaPlus,
  FaTimes,
  FaCalendarAlt,
} from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProductListApi,
  postGodownTPApi,
} from "../Warehouse Section/data/data";

const defaultProduct = {
  productId: "",
  productName: "",
  quantityKg: "", // Changed from quantityKg to quantityMt (Metric Tons)
  bagSize: "", // Bag weight in kg
  totalBags: "",
};

const defaultFormData = {
  tpPassType: "GrByRail",
  issuedBy: "Rack",
  receivedBy: "Railhead",
  products: [{ ...defaultProduct }],
};

// New product fields configuration
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

const GrByRail = ({ setShowForm, setSelectedFormType }) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    category: "",
  });
  const [newProductErrors, setNewProductErrors] = useState({});

  const queryClient = useQueryClient();

  // Function to handle wheel event and prevent scrolling from changing number values
  const handleWheel = (e) => {
    e.target.blur();
  };

  // Fetch Product list - with proper pagination
  const { data: inventoryResponse = {}, isFetching: inventoryLoading } =
    useQuery({
      queryKey: ["inventoryList", { page: 1, limit: 100 }],
      queryFn: ({ queryKey }) => getProductListApi({ queryKey }),
    });

  // Extract inventory list from response
  const inventoryList = inventoryResponse?.data || [];

  // Mutation for submitting GR By Rail form
  const { mutate: postGrByRail, isLoading: isSubmitting } = useMutation({
    mutationFn: postGodownTPApi,
    onSuccess: () => {
      toast.success("GR By Rail added successfully!");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
    // Convert quantityKg to quantityKg for API (multiply by 1000)
    const payload = {
      tpPassType: formData.tpPassType,
      issuedBy: formData.issuedBy,
      receivedBy: formData.receivedBy,
      date: currentDate, // Add current date
      products: formData.products.map((product) => ({
        productId: product.productId,
        productName: product.productName || "",
        quantityKg: parseFloat(product.quantityKg) * 1000, // Convert MT to Kg
        bagSize: parseFloat(product.bagSize) || 0,
        totalBags: parseInt(product.totalBags) || 0,
      })),
    };

    // Debug: log the final payload
    console.log("Final API payload:", payload);

    // Call mutation
    postGrByRail(payload);
  };

  // Prepare product options for React Select
  const getProductOptions = () => {
    const productOptions = inventoryList.map((item) => ({
      value: item._id,
      label: `${item.productName}${item.category ? ` (${item.category})` : ""}`,
      productName: item.productName, // Add productName to the option object
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

  // Handle product selection with clearing
  const handleProductSelect = (selected, index) => {
    // If user clicks the clear (X) button, selected will be null
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
      // Open new product modal
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

  // Function to calculate quantity in MT based on bags and bag size
  const calculateQuantity = (totalBags, bagSizeKg) => {
    if (!totalBags || !bagSizeKg || bagSizeKg <= 0) return 0;
    return (parseInt(totalBags) * parseFloat(bagSizeKg)) / 1000;
  };

  // Function to calculate bags based on quantity and bag size
  const calculateBags = (quantityKg, bagSizeKg) => {
    if (!quantityKg || !bagSizeKg || bagSizeKg <= 0) return 0;
    return Math.round((parseFloat(quantityKg) * 1000) / parseFloat(bagSizeKg));
  };

  return (
    <>
      <ToastContainer />

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h4 className="text-xl font-semibold m-0">GR By Rail Form</h4>
            </div>
            {setShowForm && (
              <button
                className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={onSubmit}>
            {/* Date Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <label className="font-semibold text-gray-700">Date:</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    readOnly
                    className="pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-md w-48"
                  />
                </div>
              </div>
            </div>

            {/* Product Details Card */}
            <div className="mb-6 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold text-gray-800 m-0">
                    Product Details
                  </h5>
                  <button
                    type="button"
                    className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={addProduct}
                    disabled={isSubmitting || inventoryLoading}
                  >
                    <FaPlus /> Add Product
                  </button>
                </div>
              </div>
              <div className="p-6">
                {inventoryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading products...</p>
                  </div>
                ) : inventoryList.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          No products found in inventory. Please add products
                          first.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  formData.products.map((product, index) => (
                    <div
                      key={index}
                      className="mb-4 border rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="flex justify-between items-center">
                          <h6 className="font-medium text-gray-800 m-0">
                            Product {index + 1}
                          </h6>
                          {formData.products.length > 1 && (
                            <button
                              type="button"
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => removeProduct(index)}
                              disabled={isSubmitting}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Product Selection Dropdown */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Select Product{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={getProductValue(product.productId)}
                              onChange={(selected) =>
                                handleProductSelect(selected, index)
                              }
                              options={getProductOptions()}
                              placeholder="Search and select product"
                              isClearable
                              isSearchable
                              isLoading={inventoryLoading}
                              isDisabled={isSubmitting}
                              filterOption={(option, inputValue) => {
                                if (option.value === "new-product") return true;
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
                              // Add menuPortalTarget and styles fix
                              menuPortalTarget={document.body}
                              styles={{
                                control: (base, state) => ({
                                  ...base,
                                  borderColor: formErrors[`productId_${index}`]
                                    ? "#ef4444"
                                    : base.borderColor,
                                  "&:hover": {
                                    borderColor: formErrors[
                                      `productId_${index}`
                                    ]
                                      ? "#ef4444"
                                      : base.borderColor,
                                  },
                                  minHeight: "42px",
                                }),
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                                menu: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                  maxHeight: "250px",
                                  overflowY: "auto",
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isSelected
                                    ? "#2563eb"
                                    : state.isFocused
                                    ? "#f3f4f6"
                                    : base.backgroundColor,
                                  color: state.isSelected
                                    ? "white"
                                    : base.color,
                                  fontWeight:
                                    state.data?.value === "new-product"
                                      ? "bold"
                                      : base.fontWeight,
                                  color:
                                    state.data?.value === "new-product"
                                      ? "#2563eb"
                                      : base.color,
                                }),
                              }}
                              className="react-select-container"
                              classNamePrefix="react-select"
                            />
                            {formErrors[`productId_${index}`] && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors[`productId_${index}`]}
                              </p>
                            )}
                            {product.productName && (
                              <p className="mt-1 text-sm text-gray-500">
                                Selected: {product.productName}
                              </p>
                            )}
                          </div>

                          {/* Bag Size (Kg per bag) */}
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
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors[`bagSize_${index}`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } disabled:bg-gray-100`}
                            />
                            {formErrors[`bagSize_${index}`] && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors[`bagSize_${index}`]}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                              Weight per bag in kilograms
                            </p>
                          </div>

                          {/* Total Bags */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total Bags <span className="text-red-500">*</span>
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
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors[`totalBags_${index}`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } disabled:bg-gray-100`}
                            />
                            {formErrors[`totalBags_${index}`] && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors[`totalBags_${index}`]}
                              </p>
                            )}
                            {product.bagSize && product.quantityKg && (
                              <p className="mt-1 text-sm text-gray-500">
                                Formula: ({product.quantityKg} MT × 1000) ÷{" "}
                                {product.bagSize} kg ={" "}
                                {calculateBags(
                                  product.quantityKg,
                                  product.bagSize
                                )}{" "}
                                bags
                              </p>
                            )}
                          </div>

                          {/* Quantity (Metric Tons) - Read Only */}
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
                              min="0.001"
                              step="0.001"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors[`quantityKg_${index}`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } bg-gray-50 disabled:bg-gray-100`}
                              readOnly
                            />
                            {formErrors[`quantityKg_${index}`] && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors[`quantityKg_${index}`]}
                              </p>
                            )}
                            {product.totalBags && product.bagSize && (
                              <p className="mt-1 text-sm text-gray-500">
                                Formula: ({product.totalBags} bags ×{" "}
                                {product.bagSize} kg) ÷ 1000 ={" "}
                                {calculateQuantity(
                                  product.totalBags,
                                  product.bagSize
                                ).toFixed(3)}{" "}
                                MT
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset Form
              </button>
              <div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={
                    isSubmitting ||
                    inventoryLoading ||
                    inventoryList.length === 0
                  }
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaSave /> Submit
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add New Product</h3>
                {!isAddingProduct && (
                  <button
                    onClick={() => setShowNewProductModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <FaTimes size={20} />
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleAddNewProduct}>
              <div className="p-6">
                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <FaInfoCircle className="text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-700">
                        Add a new product to the inventory. This product will be
                        available for selection in all forms.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
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
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        newProductErrors[field.name]
                          ? "border-red-500"
                          : "border-gray-300"
                      } disabled:bg-gray-100`}
                    />
                    {newProductErrors[field.name] && (
                      <p className="mt-1 text-sm text-red-600">
                        {newProductErrors[field.name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={() => setShowNewProductModal(false)}
                    disabled={isAddingProduct}
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isAddingProduct}
                  >
                    {isAddingProduct ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GrByRail;
