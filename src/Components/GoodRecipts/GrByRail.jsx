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
  quantityMT: "",
  bagSize: "",
  totalBags: "",
};

const defaultFormData = {
  tpPassType: "GrByRail",
  issuedBy: "Rack",
  receivedBy: "Railhead",
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

const GrByRail = ({ setShowForm, setSelectedFormType }) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [calculationSource, setCalculationSource] = useState({});

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
      setFormData(defaultFormData);
      setCalculationSource({});
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

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];

    if (field === "productId") {
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

  const validateForm = () => {
    const errors = {};

    formData.products.forEach((product, index) => {
      if (!product.productId) {
        errors[`productId_${index}`] =
          `Product selection for product ${index + 1} is required`;
      }
      if (!product.quantityMT || parseFloat(product.quantityMT) <= 0) {
        errors[`quantityMT_${index}`] =
          `Valid quantity for product ${index + 1} is required`;
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

    const currentDate = new Date().toISOString().split("T")[0];

    const payload = {
      tpPassType: formData.tpPassType,
      issuedBy: formData.issuedBy,
      receivedBy: formData.receivedBy,
      date: currentDate,
      products: formData.products.map((product) => ({
        productId: product.productId,
        productName: product.productName || "",
        quantityMT: parseFloat(product.quantityMT) || 0,
        bagSize: parseFloat(product.bagSize) || 0,
        totalBags: parseInt(product.totalBags) || 0,
      })),
    };

    console.log("Final API payload:", payload);
    postGrByRail(payload);
  };

  // Prepare product options for React Select
  const getProductOptions = () => {
    return inventoryList.map((item) => ({
      value: item._id,
      label: `${item.productName}${item.category ? ` (${item.category})` : ""}`,
      productName: item.productName,
    }));
  };

  const getProductValue = (productId) => {
    if (!productId) return null;

    const selectedProduct = inventoryList.find(
      (item) => item._id === productId,
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

  const handleProductSelect = (selected, index) => {
    if (selected === null) {
      const updatedProducts = [...formData.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: "",
        productName: "",
      };
      setFormData((prev) => ({ ...prev, products: updatedProducts }));

      if (formErrors[`productId_${index}`]) {
        setFormErrors((prev) => ({ ...prev, [`productId_${index}`]: "" }));
      }
      return;
    }

    const selectedProduct = inventoryList.find(
      (item) => item._id === selected?.value,
    );

    if (selectedProduct) {
      const updatedProducts = [...formData.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: selectedProduct._id,
        productName: selectedProduct.productName || "",
      };

      setFormData((prev) => ({ ...prev, products: updatedProducts }));

      if (formErrors[`productId_${index}`]) {
        setFormErrors((prev) => ({ ...prev, [`productId_${index}`]: "" }));
      }
    }
  };

  const handleReset = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setCalculationSource({});
  };

  return (
    <>
      <ToastContainer />

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white px-6 py-4 rounded-t-lg">
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
                    className="border border-[#504255] text-[#504255] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#cbb4d4] hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  formData.products.map((product, index) => {
                    const quantityHint = getCalculationHint(
                      index,
                      "quantityMT",
                    );
                    const bagSizeHint = getCalculationHint(index, "bagSize");
                    const totalBagsHint = getCalculationHint(
                      index,
                      "totalBags",
                    );

                    return (
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
                                menuPortalTarget={document.body}
                                styles={{
                                  control: (base, state) => ({
                                    ...base,
                                    borderColor: formErrors[
                                      `productId_${index}`
                                    ]
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
                                Bag Size (kg)
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
                                onWheel={handleWheel}
                                disabled={isSubmitting}
                                placeholder="e.g., 50"
                                min="0.01"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>

                            {/* Total Bags */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                onWheel={handleWheel}
                                disabled={isSubmitting}
                                placeholder="e.g., 100"
                                min="1"
                                step="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                            </div>

                            {/* Quantity (Metric Tons) - Required */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                onWheel={handleWheel}
                                disabled={isSubmitting}
                                placeholder="e.g., 5"
                                min="0.001"
                                step="0.001"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  formErrors[`quantityMT_${index}`]
                                    ? "border-red-500"
                                    : "border-gray-300"
                                } disabled:bg-gray-100`}
                              />
                              {formErrors[`quantityMT_${index}`] && (
                                <p className="mt-1 text-sm text-red-600">
                                  {formErrors[`quantityMT_${index}`]}
                                </p>
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
                  className="bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white px-8 py-3 rounded-md font-medium hover:from-[#46384d] hover:to-[#b9a2c9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </>
  );
};

export default GrByRail;
