import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  DriverApi,
  getCompanyNameApi,
  VehicleApi,
} from "../../../TransportPass/data/data";
import { getProductListApi, getWarehouseListApi } from "../../data/data";

// Product item structure for form state
const defaultProduct = {
  warehouseId: "",
  warehouseName: "",
  productId: "",
  productName: "",
  quantityKg: "",
  bags: "",
  itemUnit: "",
  itemWeight: "",
  itemCost: "",
};

const defaultFormData = {
  supervisorId: "",
  workerId: "",
  companyId: "",
  companyName: "",
  companyEmail: "",
  companyMobileNumber: "",
  companyOfficeNumber: "",
  companyAddress: "",
  gstIn: "",
  date: "",
  vehicleId: "",
  vehicleName: "",
  driverId: "",
  driverName: "",
  ownerName: "",
  consignorName: "",
  consignorAddress: "",
  consigneeName: "",
  consigneeAddress: "",
  customerName: "",
  customerAddress: "",
  startLocation: "",
  endLocation: "",
  sealNumber: "",
  containerNumber: "",
  customerRate: "",
  totalAmount: "",
  transporterRate: "",
  totalTransporterAmount: "",
  transporterRateOn: "",
  customerRateOn: "",
  customerFreight: "",
  transporterFreight: "",
  products: [defaultProduct],
};

// Field configurations for different sections
const fieldConfigurations = {
  consignor: [
    { name: "ownerName", label: "Owner Name", type: "text" },
    {
      name: "consignorName",
      label: "Consignor Name",
      type: "text",
      required: true,
    },
    { name: "consignorAddress", label: "Consignor Address", type: "textarea" },
  ],

  consignee: [
    {
      name: "consigneeName",
      label: "Consignee Name",
      type: "text",
      required: true,
    },
    { name: "consigneeAddress", label: "Consignee Address", type: "textarea" },
  ],

  customer: [
    { name: "customerName", label: "Customer Name", type: "text" },
    { name: "customerAddress", label: "Customer Address", type: "textarea" },
  ],

  locations: [
    { name: "startLocation", label: "Start Location", type: "text" },
    { name: "endLocation", label: "End Location", type: "text" },
  ],

  otherDetails: [
    { name: "sealNumber", label: "Seal Number", type: "text" },
    { name: "containerNumber", label: "Container Number", type: "text" },
  ],

  rates: [
    { name: "customerRate", label: "Customer Rate", type: "number" },
    { name: "transporterRate", label: "Transporter Rate", type: "number" },
    {
      name: "customerRateOn",
      label: "Customer Rate On",
      type: "text",
      placeholder: "e.g., Per Ton",
    },
    {
      name: "transporterRateOn",
      label: "Transporter Rate On",
      type: "text",
      placeholder: "e.g., Per Ton",
    },
    { name: "customerFreight", label: "Customer Freight", type: "number" },
    {
      name: "transporterFreight",
      label: "Transporter Freight",
      type: "number",
    },
    { name: "totalAmount", label: "Total Amount", type: "number" },
    {
      name: "totalTransporterAmount",
      label: "Total Transporter Amount",
      type: "number",
    },
  ],
};

// Product field configuration
const productFields = [
  {
    name: "warehouseId",
    label: "Warehouse",
    type: "select",
    section: "Product Details",
    required: true,
  },
  {
    name: "productId",
    label: "Product",
    type: "select",
    section: "Product Details",
    required: true,
  },
  {
    name: "quantityKg",
    label: "Quantity (Kg)",
    type: "number",
    section: "Product Details",
  },
  {
    name: "bags",
    label: "Bags",
    type: "number",
    section: "Product Details",
  },
  {
    name: "itemUnit",
    label: "Unit",
    type: "number",
    section: "Product Details",
  },
  {
    name: "itemWeight",
    label: "Weight",
    type: "number",
    section: "Product Details",
  },
  {
    name: "itemCost",
    label: "Cost",
    type: "number",
    section: "Product Details",
  },
];

const GodownTpFrom = ({
  show,
  handleClose,
  handleSubmit,
  initialData = {},
  mode = "add",
  isLoading = false,
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [productRows, setProductRows] = useState([0]);

  // Mock userRole - you should replace this with actual user role from your auth context
  const userRole = "admin"; // Change this based on your auth system

  // Fetch companies
  const { data: companyList = [], isFetching: companiesLoading } = useQuery({
    queryKey: ["companyList"],
    queryFn: getCompanyNameApi,
    staleTime: 1000 * 60 * 30,
  });

  // Fetch Warehouse list
  const { data: warehouseResponse = {}, isFetching: warehousesLoading } =
    useQuery({
      queryKey: ["getWarehouseList", { page: 1, limit: 100 }],
      queryFn: ({ queryKey }) => getWarehouseListApi(queryKey[1]),
      staleTime: 1000 * 60 * 30,
    });

  // Fetch Product list
  const { data: inventoryResponse = {}, isFetching: inventoryLoading } =
    useQuery({
      queryKey: ["inventoryList", { page: 1, limit: 100 }],
      queryFn: ({ queryKey }) => getProductListApi({ queryKey }),
      staleTime: 1000 * 60 * 30,
    });

  // Extract warehouse list from response
  const warehouseList = warehouseResponse?.data || [];

  // Extract inventory list from response
  const inventoryList = inventoryResponse?.data || [];

  // Mock worker list - replace with actual API call
  const workerList = [];

  // Fetch drivers
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const data = await DriverApi();
        setDrivers(data || []);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };
    loadDrivers();
  }, []);

  // Fetch vehicles
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await VehicleApi();
        setVehicles(data || []);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };
    loadVehicles();
  }, []);

  // Set form data when in edit mode or when modal opens
  useEffect(() => {
    if (mode === "edit" && initialData && Object.keys(initialData).length > 0) {
      const products = initialData.products?.map((product) => ({
        ...defaultProduct,
        ...product,
        quantityKg: product.quantityKg?.toString() || "",
        bags: product.bags?.toString() || "",
        itemUnit: product.itemUnit?.toString() || "",
        itemWeight: product.itemWeight?.toString() || "",
        itemCost: product.itemCost?.toString() || "",
      })) || [defaultProduct];

      setFormData({
        ...defaultFormData,
        ...initialData,
        date: initialData.date ? initialData.date.split("T")[0] : "",
        companyId: initialData.companyId || "",
        products,
      });

      // Set product rows based on number of products
      setProductRows(Array.from({ length: products.length }, (_, i) => i));
    } else {
      // For add mode, set today's date
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        ...defaultFormData,
        date: today,
      });
      setProductRows([0]);
    }
  }, [initialData, mode]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle textarea changes
  const handleTextAreaChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle product changes for specific row
  const handleProductChange = (rowIndex, fieldName, value) => {
    const updatedProducts = [...formData.products];

    if (!updatedProducts[rowIndex]) {
      updatedProducts[rowIndex] = { ...defaultProduct };
    }

    if (fieldName === "warehouseId") {
      const selectedWarehouse = warehouseList.find(
        (w) => w.id === value || w._id === value
      );
      updatedProducts[rowIndex] = {
        ...updatedProducts[rowIndex],
        warehouseId: value,
        warehouseName:
          selectedWarehouse?.wareHouseName || selectedWarehouse?.name || "",
      };
    } else if (fieldName === "productId") {
      const selectedProduct = inventoryList.find(
        (p) => p.id === value || p._id === value
      );
      updatedProducts[rowIndex] = {
        ...updatedProducts[rowIndex],
        productId: value,
        productName:
          selectedProduct?.productName || selectedProduct?.name || "",
      };
    } else {
      updatedProducts[rowIndex] = {
        ...updatedProducts[rowIndex],
        [fieldName]: value,
      };
    }

    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  // Handle select changes for products
  const handleProductSelectChange = (selectedOption, rowIndex, fieldName) => {
    const value = selectedOption ? selectedOption.value : "";
    handleProductChange(rowIndex, fieldName, value);
  };

  // Add new product row
  const addProductRow = () => {
    const newIndex = productRows.length;
    setProductRows([...productRows, newIndex]);
    const updatedProducts = [...formData.products, { ...defaultProduct }];
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  // Remove product row
  const removeProductRow = (rowIndex) => {
    if (productRows.length > 1) {
      const updatedRows = productRows.filter((_, index) => index !== rowIndex);
      const updatedProducts = formData.products.filter(
        (_, index) => index !== rowIndex
      );
      setProductRows(updatedRows);
      setFormData((prev) => ({ ...prev, products: updatedProducts }));
    }
  };

  // Prepare options for Select components
  const warehouseOptions = warehouseList.map((w) => ({
    value: w.id || w._id,
    label: w.wareHouseName || w.name || "Unnamed Warehouse",
  }));

  const productOptions = inventoryList.map((p) => ({
    value: p.id || p._id,
    label: p.productName || p.name || "Unnamed Product",
  }));

  const companyOptions = companyList.map((c) => ({
    value: c.id || c._id,
    label: c.companyName || c.name || "Unnamed Company",
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id || v._id,
    label: v.name || v.vehicleNumber || "Unnamed Vehicle",
  }));

  const driverOptions = drivers.map((d) => ({
    value: d.id || d._id,
    label: d.name || "Unnamed Driver",
  }));

  // Get current value for selects
  const getCurrentValue = (options, id) => {
    if (!id) return null;
    return options.find((opt) => opt.value === id) || null;
  };

  // Get product field value for specific row
  const getProductFieldValue = (rowIndex, fieldName) => {
    const product = formData.products[rowIndex];
    if (!product) return null;

    if (fieldName === "warehouseId") {
      return getCurrentValue(warehouseOptions, product.warehouseId);
    } else if (fieldName === "productId") {
      return getCurrentValue(productOptions, product.productId);
    }
    return product[fieldName] || "";
  };

  // Render product field based on type
  const renderProductField = (field, rowIndex) => {
    const value = getProductFieldValue(rowIndex, field.name);

    if (field.type === "select") {
      const options =
        field.name === "warehouseId" ? warehouseOptions : productOptions;
      const isLoading =
        field.name === "warehouseId" ? warehousesLoading : inventoryLoading;

      return (
        <Select
          value={value}
          onChange={(selected) =>
            handleProductSelectChange(selected, rowIndex, field.name)
          }
          options={options}
          placeholder={`Select ${field.label}`}
          isClearable
          isLoading={isLoading}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      );
    }

    return (
      <input
        type={field.type}
        value={value}
        onChange={(e) =>
          handleProductChange(rowIndex, field.name, e.target.value)
        }
        disabled={isLoading}
        placeholder={field.placeholder}
        required={field.required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    );
  };

  // Render form fields for a section
  const renderFormFields = (fields) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleTextAreaChange}
                disabled={isLoading}
                placeholder={field.placeholder}
                required={field.required}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            ) : field.type === "select" ? (
              <Select
                value={getCurrentValue(
                  field.name === "vehicleId"
                    ? vehicleOptions
                    : field.name === "driverId"
                    ? driverOptions
                    : companyOptions,
                  formData[field.name]
                )}
                onChange={(selected) => {
                  if (selected) {
                    setFormData((prev) => ({
                      ...prev,
                      [field.name]: selected.value,
                      [field.name.replace("Id", "Name")]: selected.label,
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      [field.name]: "",
                      [field.name.replace("Id", "Name")]: "",
                    }));
                  }
                }}
                options={
                  field.name === "vehicleId"
                    ? vehicleOptions
                    : field.name === "driverId"
                    ? driverOptions
                    : companyOptions
                }
                placeholder={`Select ${field.label}`}
                isClearable
                isLoading={isLoading}
              />
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                disabled={isLoading}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Prepare payload for submission
  const onSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.date) {
      alert("Please select a date");
      return;
    }

    if (!formData.vehicleId) {
      alert("Please select a vehicle");
      return;
    }

    if (!formData.driverId) {
      alert("Please select a driver");
      return;
    }

    const payload = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      products: formData.products.map((product) => ({
        ...product,
        quantityKg: parseFloat(product.quantityKg) || 0,
        bags: parseFloat(product.bags) || 0,
        itemUnit: parseFloat(product.itemUnit) || 0,
        itemWeight: parseFloat(product.itemWeight) || 0,
        itemCost: parseFloat(product.itemCost) || 0,
      })),
    };

    // Remove empty strings and convert to null
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") {
        payload[key] = null;
      }
    });

    handleSubmit(payload);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === "edit" ? "Edit" : "Add"} Lorry Receipt
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <form onSubmit={onSubmit}>
              {/* Company Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Company Details
                </h4>
                {renderFormFields([
                  {
                    name: "companyId",
                    label: "Company Name",
                    type: "select",
                    required: true,
                  },
                ])}
              </div>

              {/* Basic Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Basic Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Name <span className="text-red-500">*</span>
                    </label>
                    <CreatableSelect
                      name="vehicleId"
                      value={getCurrentValue(
                        vehicleOptions,
                        formData.vehicleId
                      )}
                      onChange={(selected) => {
                        if (selected) {
                          setFormData((prev) => ({
                            ...prev,
                            vehicleId: selected.value,
                            vehicleName: selected.label,
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            vehicleId: "",
                            vehicleName: "",
                          }));
                        }
                      }}
                      options={vehicleOptions}
                      placeholder="Select or type new vehicle"
                      isClearable
                      isLoading={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Driver Name <span className="text-red-500">*</span>
                    </label>
                    <CreatableSelect
                      name="driverId"
                      value={getCurrentValue(driverOptions, formData.driverId)}
                      onChange={(selected) => {
                        if (selected) {
                          setFormData((prev) => ({
                            ...prev,
                            driverId: selected.value,
                            driverName: selected.label,
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            driverId: "",
                            driverName: "",
                          }));
                        }
                      }}
                      options={driverOptions}
                      placeholder="Select or type new driver"
                      isClearable
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Consignor Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Consignor Details
                </h4>
                {renderFormFields(fieldConfigurations.consignor)}
              </div>

              {/* Consignee Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Consignee Details
                </h4>
                {renderFormFields(fieldConfigurations.consignee)}
              </div>

              {/* Customer Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Customer Details
                </h4>
                {renderFormFields(fieldConfigurations.customer)}
              </div>

              {/* Location Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Location Details
                </h4>
                {renderFormFields(fieldConfigurations.locations)}
              </div>

              {/* Product Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Product Details
                </h4>
                <div className="mb-4">
                  {productRows.map((_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="border rounded-lg p-4 mb-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-md font-medium text-gray-900">
                          Product {rowIndex + 1}
                        </h5>
                        {productRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProductRow(rowIndex)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {productFields.map((field) => (
                          <div
                            key={`${rowIndex}-${field.name}`}
                            className="space-y-2"
                          >
                            <label className="block text-sm font-medium text-gray-700">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {renderProductField(field, rowIndex)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addProductRow}
                    disabled={isLoading}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Another Product
                    </div>
                  </button>
                </div>
              </div>

              {/* Other Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Other Details
                </h4>
                {renderFormFields(fieldConfigurations.otherDetails)}
              </div>

              {/* Rate Details */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                  Rate Details
                </h4>
                {renderFormFields(fieldConfigurations.rates)}
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {mode === "edit" ? "Updating..." : "Creating..."}
                    </div>
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
  );
};

export default GodownTpFrom;
